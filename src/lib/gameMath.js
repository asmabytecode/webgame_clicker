import { sectorReward, sectorRequirement, soulReward } from "../../shared/gameMath.js";

export {
  automationMultiplier,
  autoRate,
  clickPower,
  contractMultiplier,
  incomeMultiplier,
  offlineCapSeconds,
  resonanceMultiplier,
  sectorReward,
  sectorRequirement,
  soulReward,
} from "../../shared/gameMath.js";

export const format = (value) => Math.floor(value).toLocaleString("ru-RU");
export const getLevel = (state, id) => state.tree[id] || 0;
export const getSoulLevel = (state, id) => state.soulTree[id] || 0;

export function nextSoulThreshold(state) {
  const currentReward = soulReward(state);
  const bonus = 1 + (state.relicTree.relicSouls || 0) * 0.12;
  return Math.ceil(((currentReward + 1) / bonus) ** 2 * 10000);
}

export function nextSectorThreshold(state) {
  return sectorRequirement(sectorReward(state) + 1);
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
