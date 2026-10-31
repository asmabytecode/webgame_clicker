import test from "node:test";
import assert from "node:assert/strict";
import { applyGameAction, autoRate, createGameState, sectorReward, soulReward } from "../game.js";
import {
  ascensionNodes,
  lifetimeMilestones,
  relicNodes,
  soulNodes,
} from "../../../../shared/game/gameData.js";
import { earn } from "../gameEconomy.js";

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

test("seven-day progression advances through prestige currencies and upgrade trees", () => {
  const state = createGameState(Date.UTC(2026, 0, 1));
  const daySummary = [];

  for (let day = 0; day < 7; day++) {
    for (let click = 0; click < 240; click++) applyGameAction(state, { type: "click" });
    purchaseAffordableAutomation(state);
    earn(state, autoRate(state) * 8 * 60 * 60);
    purchaseAffordableAutomation(state);
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

    if (soulReward(state) > 0 && state.rebirths === 0) {
      applyGameAction(state, { type: "rebirth" });
    } else if (state.rebirths > 0 && state.totalEarned >= 1_000_000 && day % 2 === 1) {
      applyGameAction(state, { type: "ascend" });
      const node = ascensionNodes[0];
      const cost = Math.floor(node.baseCost * node.growth ** state.ascensionTree[node.id]);
      if (state.ascensionCores >= cost) {
        applyGameAction(state, { type: "buyAscension", id: node.id });
      }
    } else if (sectorReward(state) > 0) {
      applyGameAction(state, { type: "sectorReset" });
    }

    daySummary.push({
      day: day + 1,
      allTimeEarned: Math.floor(state.allTimeEarned),
      relics: state.relics,
      souls: state.souls,
      cores: state.ascensionCores,
      resets: state.rebirths + state.sectorResets + state.ascensions,
    });
  }

  assert.ok(daySummary[0].allTimeEarned >= 1000);
  assert.ok(daySummary.at(-1).allTimeEarned >= 2000000);
  assert.ok(daySummary.at(-1).resets > 0);
  assert.ok(state.rebirths > 0);
  assert.ok(state.sectorResets > 0);
  assert.ok(state.ascensions > 0);
  assert.equal(state.claimedMilestones.length, lifetimeMilestones.length);
  assert.equal(relicNodes.length, 4);
  assert.equal(soulNodes.length, 4);
  assert.equal(ascensionNodes.length, 6);
  console.log("Seven-day economy sample:", JSON.stringify(daySummary));
});
