import test from "node:test";
import assert from "node:assert/strict";
import {
  applyGameAction,
  accrueAutoIncome,
  autoRate,
  createGameState,
  normalizeGameState,
  offlineCapSeconds,
  sectorReward,
  soulReward,
} from "./game.js";

test("each player starts with a clean, complete skill tree", () => {
  const state = createGameState();
  assert.equal(state.coins, 0);
  assert.equal(state.selected, "classic");
  assert.equal(Object.keys(state.tree).length, 16);
  assert.equal(Object.keys(state.soulTree).length, 4);
  assert.equal(Object.keys(state.researchTree).length, 4);
  assert.equal(Object.keys(state.relicTree).length, 4);
});

test("skill nodes enforce prerequisites and charge their price", () => {
  const state = createGameState();
  state.coins = 1000;
  assert.throws(
    () => applyGameAction(state, { type: "buyNode", id: "muscle" }),
    /предыдущие навыки/,
  );
  applyGameAction(state, { type: "buyNode", id: "finger" });
  assert.equal(state.tree.finger, 1);
  assert.equal(state.coins, 975);
});

test("buy max purchases every affordable level and tracks upgrades", () => {
  const state = createGameState();
  state.coins = 1000;

  const result = applyGameAction(state, {
    type: "buyMax",
    purchaseType: "buyNode",
    id: "bot",
  });

  assert.equal(result.purchases, 6);
  assert.equal(state.tree.bot, 6);
  assert.equal(state.coins, 80);
  assert.equal(state.daily.progress.dailyUpgrades, 3);
});

test("buy max respects currency and rejects invalid purchase types", () => {
  const state = createGameState();
  state.souls = 7;

  const result = applyGameAction(state, {
    type: "buyMax",
    purchaseType: "buySoul",
    id: "soulClick",
  });

  assert.equal(result.purchases, 3);
  assert.equal(state.soulTree.soulClick, 3);
  assert.equal(state.souls, 1);
  assert.throws(
    () => applyGameAction(state, { type: "buyMax", purchaseType: "reset", id: "anything" }),
    { status: 400 },
  );
  assert.throws(
    () =>
      applyGameAction(state, {
        type: "buyMax",
        purchaseType: "buyNode",
        id: "missing",
      }),
    { status: 400 },
  );
});

test("automatic income is calculated by the server from elapsed time", () => {
  const state = createGameState();
  state.tree.bot = 2;
  state.lastTickAt = 1000;
  const earned = accrueAutoIncome(state, 4000);
  assert.equal(earned, 6);
  assert.equal(state.coins, 6);
  assert.equal(state.totalEarned, 6);
  assert.equal(state.lastTickAt, 4000);
});

test("manual clicks charge the purchased synchronization multiplier for automation", () => {
  const state = createGameState();
  state.tree.bot = 10;
  state.tree.resonance = 2;
  const baseRate = autoRate(state);

  for (let click = 0; click < 25; click++) applyGameAction(state, { type: "click" });
  assert.equal(autoRate(state), baseRate * 1.02);

  state.totalClicks = 2500;
  assert.equal(autoRate(state), baseRate * 2);
});

test("synchronization upgrade requires three processor overclock levels", () => {
  const state = createGameState();
  state.coins = 5000;

  assert.throws(
    () => applyGameAction(state, { type: "buyNode", id: "resonance" }),
    /предыдущие навыки/,
  );

  state.tree.overclock = 3;
  applyGameAction(state, { type: "buyNode", id: "resonance" });
  assert.equal(state.tree.resonance, 1);
});

test("daily contracts cannot be claimed before completion or twice", () => {
  const state = createGameState();
  assert.throws(
    () => applyGameAction(state, { type: "claimContract", id: "dailyClicks" }),
    /выполни контракт/,
  );

  for (let count = 0; count < 60; count++) applyGameAction(state, { type: "click" });
  const result = applyGameAction(state, { type: "claimContract", id: "dailyClicks" });

  assert.equal(result.researchReward, 2);
  assert.equal(result.coinReward, 250);
  assert.equal(state.research, 2);
  assert.ok(state.daily.claimed.includes("dailyClicks"));
  assert.throws(
    () => applyGameAction(state, { type: "claimContract", id: "dailyClicks" }),
    /уже получен/,
  );
});

test("daily contracts reset at UTC midnight and do not erase permanent currencies", () => {
  const yesterday = Date.UTC(2026, 0, 1, 23, 59);
  const today = Date.UTC(2026, 0, 2, 0, 1);
  const previous = createGameState(yesterday);
  previous.daily.progress.dailyClicks = 45;
  previous.daily.claimed.push("dailyIncome");
  previous.research = 8;
  const updated = normalizeGameState(previous, today);

  assert.equal(updated.daily.day, "2026-01-02");
  assert.equal(updated.daily.progress.dailyClicks, 0);
  assert.deepEqual(updated.daily.claimed, []);
  assert.equal(updated.research, 8);
});

test("research investments are permanent and increase income and offline storage", () => {
  const state = createGameState();
  state.research = 20;
  state.tree.bot = 10;
  const before = offlineCapSeconds(state);
  applyGameAction(state, { type: "buyResearch", id: "researchAuto" });
  applyGameAction(state, { type: "buyResearch", id: "researchOffline" });

  assert.equal(state.researchTree.researchAuto, 1);
  assert.equal(state.researchTree.researchOffline, 1);
  assert.equal(offlineCapSeconds(state), before + 2 * 60 * 60);
  assert.ok(accrueAutoIncome(state, state.lastTickAt + 3600 * 1000) > 10 * 3600);
});

test("sector reset awards relics while retaining research and milestone records", () => {
  const state = createGameState();
  state.coins = 150000;
  state.totalEarned = 150000;
  state.allTimeEarned = 150000;
  state.tree.bot = 7;
  state.research = 4;
  state.researchTree.researchAuto = 2;
  state.relics = 3;
  state.claimedMilestones.push("milestone1");
  applyGameAction(state, { type: "buyRelic", id: "relicIncome" });

  const result = applyGameAction(state, { type: "sectorReset" });

  assert.equal(result.reward, 1);
  assert.equal(state.relics, 3);
  assert.equal(state.sectorResets, 1);
  assert.equal(state.tree.bot, 0);
  assert.equal(state.research, 4);
  assert.equal(state.researchTree.researchAuto, 2);
  assert.equal(state.relicTree.relicIncome, 1);
  assert.deepEqual(state.claimedMilestones, ["milestone1"]);
});

test("full reset intentionally removes every currency and permanent upgrade", () => {
  const state = createGameState();
  state.coins = 5000;
  state.totalEarned = 9000;
  state.allTimeEarned = 12000;
  state.souls = 4;
  state.research = 5;
  state.relics = 3;
  state.rebirths = 2;
  state.sectorResets = 1;
  state.powerLevel = 12;
  state.researchTree.researchClick = 2;
  state.relicTree.relicIncome = 1;
  state.soulTree.soulBot = 1;

  applyGameAction(state, { type: "reset" });

  assert.equal(state.coins, 0);
  assert.equal(state.allTimeEarned, 0);
  assert.equal(state.souls, 0);
  assert.equal(state.research, 0);
  assert.equal(state.relics, 0);
  assert.equal(state.rebirths, 0);
  assert.equal(state.sectorResets, 0);
  assert.equal(state.researchTree.researchClick, 0);
  assert.equal(state.relicTree.relicIncome, 0);
  assert.equal(state.soulTree.soulBot, 0);
  assert.equal("powerLevel" in state, false);
});

test("campaign rewards can be claimed once and sector rewards scale by run output", () => {
  const state = createGameState();
  state.allTimeEarned = 25000;
  const milestone = applyGameAction(state, { type: "claimMilestone", id: "milestone3" });
  assert.equal(milestone.reward, 2);
  assert.equal(state.relics, 2);
  assert.throws(
    () => applyGameAction(state, { type: "claimMilestone", id: "milestone3" }),
    /уже получена/,
  );
  assert.equal(sectorReward({ totalEarned: 50000 }), 1);
  assert.equal(sectorReward({ totalEarned: 200000 }), 2);
  assert.equal(soulReward({ totalEarned: 10000, relicTree: { relicSouls: 2 } }), 1);
  assert.equal(soulReward({ totalEarned: 40000, relicTree: { relicSouls: 2 } }), 2);
});

test("rebirth resets a run but retains soul upgrades and lifetime earnings", () => {
  const state = createGameState();
  state.coins = 40000;
  state.totalEarned = 40000;
  state.allTimeEarned = 50000;
  state.totalClicks = 250;
  state.allTimeClicks = 900;
  state.tree.bot = 8;
  state.souls = 2;
  state.soulTree.soulStart = 1;
  state.unlocked.push("neon");
  state.selected = "neon";

  const result = applyGameAction(state, { type: "rebirth" });

  assert.equal(result.reward, 2);
  assert.equal(state.coins, 100);
  assert.equal(state.totalEarned, 0);
  assert.equal(state.allTimeEarned, 50000);
  assert.equal(state.totalClicks, 0);
  assert.equal(state.allTimeClicks, 900);
  assert.equal(state.tree.bot, 0);
  assert.equal(state.selected, "classic");
  assert.deepEqual(state.unlocked, ["classic"]);
  assert.equal(state.souls, 4);
  assert.equal(state.rebirths, 1);
  assert.equal(state.soulTree.soulStart, 1);
});

test("lifetime clicks migrate from legacy saves and survive run resets", () => {
  const legacyState = normalizeGameState({ totalClicks: 17 });
  assert.equal(legacyState.allTimeClicks, 17);

  const state = createGameState();
  state.allTimeClicks = 12;
  applyGameAction(state, { type: "click" });
  assert.equal(state.allTimeClicks, 13);

  state.totalEarned = 10000;
  applyGameAction(state, { type: "rebirth" });
  assert.equal(state.allTimeClicks, 13);

  applyGameAction(state, { type: "reset" });
  assert.equal(state.allTimeClicks, 0);
});

test("malformed stored levels are clamped to configured limits", () => {
  const state = normalizeGameState({
    tree: { finger: 999, bot: -1 },
    soulTree: { soulClick: 999 },
    unlocked: ["missing"],
  });
  assert.equal(state.tree.finger, 25);
  assert.equal(state.tree.bot, 0);
  assert.equal(state.soulTree.soulClick, 10);
  assert.equal(state.relicTree.relicArchive, 0);
  assert.deepEqual(state.unlocked, ["classic"]);
});

test("saves from the original clicker migrate to the new progression schema", () => {
  const state = normalizeGameState({
    coins: 120,
    totalEarned: 900,
    powerLevel: 4,
    autoLevel: 3,
    multiplierLevel: 2,
  });

  assert.equal(state.tree.finger, 4);
  assert.equal(state.tree.bot, 3);
  assert.equal(state.legacyMultiplier, 2);
  assert.equal(state.research, 0);
  assert.equal(state.relics, 0);
  assert.equal(state.allTimeEarned, 900);
  assert.equal(state.daily.progress.dailyClicks, 0);
});
