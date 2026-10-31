import { artifacts } from "@shared/game/gameData.js";
import {
  nextAscensionThreshold,
  sectorReward,
  sectorRequirement,
  soulReward,
} from "@shared/game/gameMath.js";

export {
  automationMultiplier,
  ascensionReward,
  autoRate,
  clickPower,
  currentSector,
  incomeMultiplier,
  offlineCapSeconds,
  resonanceMultiplier,
  sectorReward,
  sectorRequirement,
  soulReward,
} from "@shared/game/gameMath.js";

export const format = (value) => Math.floor(value).toLocaleString("ru-RU");
export const getLevel = (state, id) => state.tree[id] || 0;
export const getSoulLevel = (state, id) => state.soulTree[id] || 0;

export function nextSoulThreshold(state) {
  const currentReward = soulReward(state);
  const artifact = artifacts.find((item) => item.id === state.activeArtifact);
  const artifactMultiplier = artifact?.effect === "souls" ? 1.15 : 1;
  const bonus =
    (1 + (state.relicTree.relicSouls || 0) * 0.12) *
    (1 + (state.ascensionTree.ascensionSouls || 0) * 0.2) *
    artifactMultiplier;
  return Math.ceil(((currentReward + 1) / bonus) ** 2 * 10000);
}

export function nextSectorThreshold(state) {
  return sectorRequirement(sectorReward(state) + 1);
}

export function ascensionThreshold(state) {
  return nextAscensionThreshold(state);
}

export function currentRunLevel(totalEarned) {
  const level = Math.floor(Math.sqrt(totalEarned / 100)) + 1;
  const currentStart = (level - 1) ** 2 * 100;
  const nextStart = level ** 2 * 100;
  const progress = Math.max(
    0,
    Math.min(100, ((totalEarned - currentStart) / (nextStart - currentStart)) * 100),
  );

  return { level, currentStart, nextStart, progress };
}
