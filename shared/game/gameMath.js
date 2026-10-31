import { artifacts, branches, buttonTypes, sectors } from "./gameData.js";

const level = (state, id) => state.tree[id] || 0;
const soulLevel = (state, id) => state.soulTree[id] || 0;
const relicLevel = (state, id) => state.relicTree[id] || 0;
const ascensionLevel = (state, id) => state.ascensionTree?.[id] || 0;
const ascensionIncomeMultiplier = (state) => 1 + ascensionLevel(state, "ascensionIncome") * 0.15;
const runNodeById = new Map(
  branches.flatMap((branch) => branch.nodes).map((node) => [node.id, node]),
);

function scaledRunNodeOutput(state, id, baseOutput) {
  const node = runNodeById.get(id);
  const currentLevel = level(state, id);
  if (!node || currentLevel < 1) return 0;
  const effectGrowth = 1 + (node.growth - 1) * 0.5;
  return (baseOutput * (effectGrowth ** currentLevel - 1)) / (effectGrowth - 1);
}

export function currentSector(state) {
  return sectors[state.sectorResets % sectors.length];
}

function artifactBonus(state, effect) {
  const artifact = artifacts.find((item) => item.id === state.activeArtifact);
  return artifact?.effect === effect ? artifact : null;
}

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
    (1 + ascensionLevel(state, "ascensionAuto") * 0.25)
  );
}

export function clickPower(state) {
  const button = buttonTypes.find((item) => item.id === state.selected) || buttonTypes[0];
  const base =
    button.power +
    scaledRunNodeOutput(state, "finger", 1) +
    scaledRunNodeOutput(state, "muscle", 5);
  const permanentMultiplier =
    (1 + ascensionLevel(state, "ascensionClick") * 0.25) *
    (1 + level(state, "clickMaster") * 0.2 + state.legacyMultiplier * 0.25) *
    (1 + soulLevel(state, "soulClick") * 0.1);
  const artifactMultiplier = artifactBonus(state, "click") ? 1.25 : 1;
  return Math.floor(
    base *
      permanentMultiplier *
      incomeMultiplier(state) *
      ascensionIncomeMultiplier(state) *
      artifactMultiplier *
      currentSector(state).clickMultiplier,
  );
}

export function autoRate(state) {
  const base =
    scaledRunNodeOutput(state, "bot", 1) +
    scaledRunNodeOutput(state, "swarm", 5) +
    scaledRunNodeOutput(state, "drone", 25);
  const artifactMultiplier = artifactBonus(state, "auto") ? 1.25 : 1;
  return (
    base *
    (1 + soulLevel(state, "soulBot") * 0.1) *
    automationMultiplier(state) *
    incomeMultiplier(state) *
    ascensionIncomeMultiplier(state) *
    artifactMultiplier *
    currentSector(state).autoMultiplier
  );
}

export function soulReward(state) {
  const artifactMultiplier = artifactBonus(state, "souls") ? 1.15 : 1;
  return Math.floor(
    Math.sqrt(state.totalEarned / 10000) *
      (1 + relicLevel(state, "relicSouls") * 0.12) *
      (1 + ascensionLevel(state, "ascensionSouls") * 0.2) *
      artifactMultiplier,
  );
}

export function sectorReward(state) {
  return Math.floor(Math.sqrt(state.totalEarned / 50000));
}

export function sectorRequirement(nextReward = 1) {
  return nextReward * nextReward * 50000;
}

export function offlineCapSeconds(state) {
  const ascensionHours = ascensionLevel(state, "ascensionOffline") * 2;
  const archiveHours = relicLevel(state, "relicArchive") * 2;
  return Math.min(24, 8 + ascensionHours + archiveHours) * 60 * 60;
}

export function ascensionReward(state) {
  if ((state.rebirths || 0) < 1) return 0;
  return Math.floor(Math.sqrt(state.totalEarned / 1_000_000));
}

export function nextAscensionThreshold(state) {
  const reward = ascensionReward(state);
  return Math.max(1_000_000, (reward + 1) ** 2 * 1_000_000);
}
