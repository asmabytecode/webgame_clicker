import test from "node:test";
import assert from "node:assert/strict";
import { ascensionNodes, bossHealth } from "../../../../shared/game/gameData.js";
import {
  applyGameAction,
  accrueAutoIncome,
  autoRate,
  createGameState,
  clickPower,
  normalizeGameState,
  sectorReward,
  soulReward,
} from "../game.js";
import { runCasualAutomation } from "../casualManager.js";

test("each player starts with a clean, complete skill tree", () => {
  const state = createGameState();
  assert.equal(state.coins, 0);
  assert.equal(state.selected, "classic");
  assert.equal(Object.keys(state.tree).length, 16);
  assert.equal(Object.keys(state.soulTree).length, 4);
  assert.equal(Object.keys(state.relicTree).length, 4);
  assert.equal(Object.keys(state.ascensionTree).length, ascensionNodes.length);
  assert.equal(state.ascensionCores, 0);
  assert.equal(state.bossesDefeated, 0);
  assert.deepEqual(state.ownedArtifacts, []);
});

test("sector resets rotate sector bonuses and keep them tied to the current expedition", () => {
  const state = createGameState();
  state.totalEarned = 50000;
  state.coins = 50000;
  state.tree.bot = 10;

  const baseClick = clickPower(state);
  const baseAuto = autoRate(state);
  applyGameAction(state, { type: "sectorReset" });

  assert.equal(state.sectorResets, 1);
  state.tree.bot = 10;
  assert.equal(clickPower(state), Math.floor(baseClick * 1.25));
  assert.equal(autoRate(state), baseAuto * 0.85);
});

test("boss victories award artifacts and artifact loadouts modify the matching income", () => {
  const state = createGameState();
  const health = bossHealth(state.bossesDefeated);
  state.bossDamage = health;

  const result = applyGameAction(state, { type: "claimBoss" });
  assert.equal(result.artifact.id, "artifactClick");
  assert.equal(state.bossesDefeated, 1);
  assert.equal(state.bossDamage, 0);

  const baseClick = clickPower(state);
  applyGameAction(state, { type: "equipArtifact", id: "artifactClick" });
  assert.equal(clickPower(state), Math.floor(baseClick * 1.25));
  assert.throws(() => applyGameAction(state, { type: "equipArtifact", id: "artifactAuto" }), {
    status: 409,
  });

  state.totalEarned = 10000;
  applyGameAction(state, { type: "rebirth" });
  assert.equal(state.bossesDefeated, 1);
  assert.deepEqual(state.ownedArtifacts, ["artifactClick"]);
  assert.equal(state.activeArtifact, "artifactClick");
});

test("achievements and post-campaign chapters are claimable once", () => {
  const state = createGameState();
  state.allTimeClicks = 1000;
  const achievement = applyGameAction(state, {
    type: "claimAchievement",
    id: "achievementClicks",
  });
  assert.equal(achievement.reward, 2);

  state.allTimeEarned = 5000000;
  const chapter = applyGameAction(state, { type: "claimChapter", id: "chapter1" });
  assert.equal(chapter.reward, 5);
  assert.deepEqual(state.claimedChapters, ["chapter1"]);
  assert.equal(state.relics, 7);
});

test("malformed progression is normalized", () => {
  const malformed = normalizeGameState({
    bossesDefeated: 2.5,
    bossDamage: -4,
    ownedArtifacts: ["missing", "artifactAuto"],
    activeArtifact: "missing",
  });
  assert.equal(malformed.bossesDefeated, 2);
  assert.equal(malformed.bossDamage, 0);
  assert.deepEqual(malformed.ownedArtifacts, ["artifactAuto"]);
  assert.equal(malformed.activeArtifact, null);
});

test("casual mode validates its toggle and persists through normalization", () => {
  const state = createGameState();
  applyGameAction(state, { type: "setCasualMode", enabled: true });
  assert.equal(normalizeGameState(state).casualMode, true);

  applyGameAction(state, { type: "setCasualMode", enabled: false });
  assert.equal(state.casualMode, false);
  assert.throws(() => applyGameAction(state, { type: "setCasualMode", enabled: "yes" }), {
    status: 400,
  });
});

test("casual automation buys affordable run upgrades using their configured price curve", () => {
  const state = createGameState();
  state.casualMode = true;
  state.coins = 100;

  const result = runCasualAutomation(state);

  assert.ok(result.purchases > 0);
  assert.equal(state.tree.merchant, 1);
  assert.equal(state.coins, 0);
  assert.match(state.casualStatus, /Улучшено:/);
});

test("casual automation purchases permanent upgrades and claims eligible rewards", () => {
  const state = createGameState();
  state.casualMode = true;
  state.tree.bot = 5;
  state.souls = 1;
  state.allTimeEarned = 1000;

  const result = runCasualAutomation(state);

  assert.ok(result.claims > 0);
  assert.ok(state.claimedMilestones.includes("milestone1"));
  assert.ok(state.soulTree.soulBot + state.soulTree.soulFortune + state.soulTree.soulClick > 0);
  assert.ok(state.souls < 1);
});

test("casual automation selects and performs an available rebirth", () => {
  const state = createGameState();
  state.casualMode = true;
  state.coins = 10_000;
  state.totalEarned = 10_000;

  const result = runCasualAutomation(state);

  assert.equal(result.prestige, "rebirth");
  assert.equal(state.rebirths, 1);
  assert.equal(state.souls, 1);
  assert.equal(state.totalEarned, 0);
  assert.equal(state.casualMode, true);
  assert.match(state.casualStatus, /возрождение/);
  assert.match(state.casualStatus, /SOUL/);
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

test("buy max purchases every affordable level", () => {
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
  const expectedRate = 1 + 1.225;
  assert.ok(Math.abs(earned - expectedRate * 3) < 1e-9);
  assert.ok(Math.abs(state.coins - expectedRate * 3) < 1e-9);
  assert.ok(Math.abs(state.totalEarned - expectedRate * 3) < 1e-9);
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

test("retired mission and research actions are rejected", () => {
  const state = createGameState();
  assert.throws(() => applyGameAction(state, { type: "claimContract", id: "dailyClicks" }), {
    status: 400,
  });
  assert.throws(() => applyGameAction(state, { type: "buyResearch", id: "researchAuto" }), {
    status: 400,
  });
});

test("ascension requires a rebirth and one million run credits, then preserves permanent trees", () => {
  const state = createGameState();
  state.totalEarned = 1_000_000;
  state.coins = 1_000_000;
  assert.throws(() => applyGameAction(state, { type: "ascend" }), { status: 409 });

  state.rebirths = 1;
  state.tree.bot = 5;
  state.souls = 3;
  state.relics = 4;
  state.soulTree.soulClick = 2;
  state.relicTree.relicIncome = 1;
  const result = applyGameAction(state, { type: "ascend" });

  assert.equal(result.reward, 1);
  assert.equal(state.ascensionCores, 1);
  assert.equal(state.ascensions, 1);
  assert.equal(state.totalEarned, 0);
  assert.equal(state.coins, 0);
  assert.equal(state.tree.bot, 0);
  assert.equal(state.rebirths, 1);
  assert.equal(state.souls, 3);
  assert.equal(state.relics, 4);
  assert.equal(state.soulTree.soulClick, 2);
  assert.equal(state.relicTree.relicIncome, 1);

  state.tree.finger = 10;
  state.tree.bot = 10;
  const clickBefore = clickPower(state);
  const autoBefore = autoRate(state);
  applyGameAction(state, { type: "buyAscension", id: "ascensionIncome" });
  assert.equal(state.ascensionCores, 0);
  assert.ok(clickPower(state) > clickBefore);
  assert.ok(autoRate(state) > autoBefore);
});

test("sector reset awards relics while retaining permanent progress", () => {
  const state = createGameState();
  state.coins = 150000;
  state.totalEarned = 150000;
  state.allTimeEarned = 150000;
  state.tree.bot = 7;
  state.ascensionCores = 4;
  state.ascensionTree.ascensionIncome = 2;
  state.relics = 3;
  state.claimedMilestones.push("milestone1");
  applyGameAction(state, { type: "buyRelic", id: "relicIncome" });

  const result = applyGameAction(state, { type: "sectorReset" });

  assert.equal(result.reward, 1);
  assert.equal(state.relics, 3);
  assert.equal(state.sectorResets, 1);
  assert.equal(state.tree.bot, 0);
  assert.equal(state.ascensionCores, 4);
  assert.equal(state.ascensionTree.ascensionIncome, 2);
  assert.equal(state.relicTree.relicIncome, 1);
  assert.deepEqual(state.claimedMilestones, ["milestone1"]);
});

test("full reset intentionally removes every currency and permanent upgrade", () => {
  const state = createGameState();
  state.coins = 5000;
  state.totalEarned = 9000;
  state.allTimeEarned = 12000;
  state.souls = 4;
  state.relics = 3;
  state.ascensionCores = 6;
  state.ascensions = 2;
  state.rebirths = 2;
  state.sectorResets = 1;
  state.powerLevel = 12;
  state.ascensionTree.ascensionClick = 2;
  state.relicTree.relicIncome = 1;
  state.soulTree.soulBot = 1;

  applyGameAction(state, { type: "reset" });

  assert.equal(state.coins, 0);
  assert.equal(state.allTimeEarned, 0);
  assert.equal(state.souls, 0);
  assert.equal(state.relics, 0);
  assert.equal(state.ascensionCores, 0);
  assert.equal(state.ascensions, 0);
  assert.equal(state.rebirths, 0);
  assert.equal(state.sectorResets, 0);
  assert.equal(state.ascensionTree.ascensionClick, 0);
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
  state.relicTree.relicStart = 1;
  state.unlocked.push("neon");
  state.selected = "neon";

  const result = applyGameAction(state, { type: "rebirth" });

  assert.equal(result.reward, 2);
  assert.equal(state.coins, 6000);
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
  assert.equal(state.relicTree.relicStart, 1);
});

test("run producers scale with their price curve and permanent click/auto upgrades stay relevant", () => {
  const state = createGameState();
  state.tree.bot = 5;
  const firstRate = autoRate(state);
  state.tree.bot = 6;
  const nextRate = autoRate(state);
  assert.ok(
    nextRate - firstRate > firstRate - autoRate({ ...state, tree: { ...state.tree, bot: 4 } }),
  );

  state.tree.finger = 10;
  const clickBefore = clickPower(state);
  state.soulTree.soulClick = 1;
  assert.ok(clickPower(state) >= Math.floor(clickBefore * 1.1));

  const autoBefore = autoRate(state);
  state.soulTree.soulBot = 1;
  assert.ok(Math.abs(autoRate(state) - autoBefore * 1.1) < 1e-9);
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
    ascensionTree: { ascensionClick: 999 },
    ascensionCores: -5,
    unlocked: ["missing"],
  });
  assert.equal(state.tree.finger, 25);
  assert.equal(state.tree.bot, 0);
  assert.equal(state.soulTree.soulClick, 10);
  assert.equal(state.ascensionTree.ascensionClick, 10);
  assert.equal(state.ascensionCores, 0);
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
  assert.equal(state.relics, 0);
  assert.equal(state.allTimeEarned, 900);
});
