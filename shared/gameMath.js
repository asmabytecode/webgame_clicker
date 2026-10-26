import { buttonTypes } from "./gameData.js";

const level = (state, id) => state.tree[id] || 0;
const soulLevel = (state, id) => state.soulTree[id] || 0;
const researchLevel = (state, id) => state.researchTree[id] || 0;
const relicLevel = (state, id) => state.relicTree[id] || 0;

export function incomeMultiplier(state) {
  return (
    1 +
    level(state, "merchant") * 0.1 +
    level(state, "combo") * 0.1 +
    level(state, "market") * 0.25 +
    level(state, "goldenAge") * 0.5 +
    soulLevel(state, "soulFortune") * 0.15 +
    relicLevel(state, "relicIncome") * 0.12
  );
}

export function resonanceMultiplier(state) {
  const earnedBonus = level(state, "resonance") * Math.floor(state.totalClicks / 25) * 0.01;
  return 1 + Math.min(1, earnedBonus);
}

export function automationMultiplier(state) {
  return (
    (1 + level(state, "overclock") * 0.25 + level(state, "singularity")) *
    resonanceMultiplier(state) *
    (1 + researchLevel(state, "researchAuto") * 0.08)
  );
}

export function clickPower(state) {
  const button = buttonTypes.find((item) => item.id === state.selected) || buttonTypes[0];
  const base =
    button.power +
    level(state, "finger") +
    level(state, "muscle") * 5 +
    soulLevel(state, "soulClick") * 2;
  const permanentMultiplier =
    (1 + researchLevel(state, "researchClick") * 0.08) *
    (1 + level(state, "clickMaster") * 0.2 + state.legacyMultiplier * 0.25);
  return Math.floor(base * permanentMultiplier * incomeMultiplier(state));
}

export function autoRate(state) {
  const base =
    level(state, "bot") +
    level(state, "swarm") * 5 +
    level(state, "drone") * 25 +
    soulLevel(state, "soulBot") * 2;
  return base * automationMultiplier(state) * incomeMultiplier(state);
}

export function soulReward(state) {
  return Math.floor(
    Math.sqrt(state.totalEarned / 10000) * (1 + relicLevel(state, "relicSouls") * 0.12),
  );
}

export function sectorReward(state) {
  return Math.floor(Math.sqrt(state.totalEarned / 50000));
}

export function sectorRequirement(nextReward = 1) {
  return nextReward * nextReward * 50000;
}

export function offlineCapSeconds(state) {
  const researchHours = researchLevel(state, "researchOffline") * 2;
  const archiveHours = relicLevel(state, "relicArchive") * 2;
  return Math.min(24, 8 + researchHours + archiveHours) * 60 * 60;
}

export function contractMultiplier(state) {
  return 1 + researchLevel(state, "researchContract") * 0.15;
}
