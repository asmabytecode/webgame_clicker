import test from "node:test";
import assert from "node:assert/strict";
import { applyGameAction, autoRate, createGameState, sectorReward, soulReward } from "./game.js";
import {
  dailyContracts,
  lifetimeMilestones,
  relicNodes,
  researchNodes,
  soulNodes,
} from "../shared/gameData.js";

function purchaseAffordableAutomation(state) {
  let bought;
  do {
    bought = false;
    const candidates = [
      { id: "bot", base: 50, growth: 1.45, max: 30, prerequisite: true },
      { id: "swarm", base: 220, growth: 1.55, max: 20, prerequisite: state.tree.bot >= 5 },
      { id: "overclock", base: 900, growth: 1.75, max: 10, prerequisite: state.tree.swarm >= 3 },
      { id: "drone", base: 4000, growth: 1.85, max: 20, prerequisite: state.tree.overclock >= 3 },
      { id: "singularity", base: 15000, growth: 2, max: 5, prerequisite: state.tree.drone >= 5 },
      {
        id: "resonance",
        base: 1200,
        growth: 1.8,
        max: 10,
        prerequisite: state.tree.overclock >= 3,
      },
    ];
    for (const { id, base, growth, max, prerequisite } of candidates) {
      const level = state.tree[id] || 0;
      const cost = Math.floor(base * growth ** level);
      if (prerequisite && level < max && state.coins >= cost) {
        applyGameAction(state, { type: "buyNode", id });
        bought = true;
        break;
      }
    }
  } while (bought);
}

test("seven-day session model keeps the campaign moving through currencies and resets", () => {
  const state = createGameState(Date.UTC(2026, 0, 1));
  const daySummary = [];
  let now = Date.UTC(2026, 0, 1);

  for (let day = 0; day < 7; day++) {
    state.daily.day = new Date(now).toISOString().slice(0, 10);
    state.daily.progress = { dailyClicks: 0, dailyIncome: 0, dailyUpgrades: 0 };
    state.daily.claimed = [];

    for (let click = 0; click < 240; click++) applyGameAction(state, { type: "click" });
    purchaseAffordableAutomation(state);
    const offlineIncome = autoRate(state) * 8 * 60 * 60;
    state.coins += offlineIncome;
    state.totalEarned += offlineIncome;
    state.allTimeEarned += offlineIncome;
    state.daily.progress.dailyIncome = Math.min(
      2500,
      state.daily.progress.dailyIncome + offlineIncome,
    );
    purchaseAffordableAutomation(state);
    while (state.research >= Math.floor(3 * 1.8 ** state.researchTree.researchAuto)) {
      applyGameAction(state, { type: "buyResearch", id: "researchAuto" });
    }

    for (const contract of dailyContracts) {
      if (state.daily.progress[contract.id] >= contract.target) {
        applyGameAction(state, { type: "claimContract", id: contract.id });
      }
    }
    for (const milestone of lifetimeMilestones) {
      if (
        state.allTimeEarned >= milestone.target &&
        !state.claimedMilestones.includes(milestone.id)
      ) {
        applyGameAction(state, { type: "claimMilestone", id: milestone.id });
      }
    }

    for (const id of ["relicIncome", "relicStart", "relicSouls", "relicArchive"]) {
      const node = relicNodes.find((item) => item.id === id);
      const level = state.relicTree[id];
      const cost = Math.floor(node.baseCost * node.growth ** level);
      if (level < node.max && state.relics >= cost) {
        applyGameAction(state, { type: "buyRelic", id });
      }
    }

    if (day === 0 && soulReward(state) > 0) {
      applyGameAction(state, { type: "rebirth" });
    } else if (sectorReward(state) > 0) {
      applyGameAction(state, { type: "sectorReset" });
    }

    daySummary.push({
      day: day + 1,
      allTimeEarned: Math.floor(state.allTimeEarned),
      research: state.research,
      relics: state.relics,
      souls: state.souls,
      resets: state.rebirths + state.sectorResets,
    });
    now += 24 * 60 * 60 * 1000;
  }

  assert.ok(daySummary[0].allTimeEarned >= 1000);
  assert.ok(daySummary[0].research >= 5);
  assert.ok(daySummary.at(-1).allTimeEarned >= 2000000);
  assert.ok(daySummary.at(-1).resets > 0);
  assert.ok(state.rebirths > 0);
  assert.ok(state.sectorResets > 0);
  assert.equal(state.claimedMilestones.length, lifetimeMilestones.length);
  assert.equal(relicNodes.length, 4);
  assert.equal(researchNodes.length, 4);
  assert.equal(soulNodes.length, 4);
  console.log("Seven-day economy sample:", JSON.stringify(daySummary));
});
