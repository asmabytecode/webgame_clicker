import {
  branches,
  buttonTypes,
  dailyContracts,
  lifetimeMilestones,
  relicNodes,
  researchNodes,
  soulNodes,
} from "../shared/gameData.js";

const runNodes = branches.flatMap((branch) => branch.nodes);
const utcDay = (timestamp) => new Date(timestamp).toISOString().slice(0, 10);

function emptyDailyProgress() {
  return Object.fromEntries(dailyContracts.map((contract) => [contract.id, 0]));
}

export function createGameState(now = Date.now()) {
  return {
    coins: 0,
    totalEarned: 0,
    allTimeEarned: 0,
    totalClicks: 0,
    allTimeClicks: 0,
    selected: "classic",
    unlocked: ["classic"],
    tree: Object.fromEntries(runNodes.map((node) => [node.id, 0])),
    souls: 0,
    rebirths: 0,
    soulTree: Object.fromEntries(soulNodes.map((node) => [node.id, 0])),
    research: 0,
    researchTree: Object.fromEntries(researchNodes.map((node) => [node.id, 0])),
    relics: 0,
    sectorResets: 0,
    relicTree: Object.fromEntries(relicNodes.map((node) => [node.id, 0])),
    claimedMilestones: [],
    daily: { day: utcDay(now), progress: emptyDailyProgress(), claimed: [] },
    legacyMultiplier: 0,
    lastTickAt: now,
  };
}

function normalizeLevels(input, nodes) {
  const levels = input && typeof input === "object" ? input : {};
  return Object.fromEntries(
    nodes.map((node) => {
      const value = levels[node.id];
      return [node.id, Number.isInteger(value) ? Math.max(0, Math.min(node.max, value)) : 0];
    }),
  );
}

export function normalizeDaily(input, now) {
  const today = utcDay(now);
  if (!input || input.day !== today) {
    return { day: today, progress: emptyDailyProgress(), claimed: [] };
  }
  const progress = emptyDailyProgress();
  for (const contract of dailyContracts) {
    const value = input.progress?.[contract.id];
    progress[contract.id] = Number.isFinite(value)
      ? Math.max(0, Math.min(contract.target, value))
      : 0;
  }
  const claimed = Array.isArray(input.claimed)
    ? [
        ...new Set(
          input.claimed.filter((id) => dailyContracts.some((contract) => contract.id === id)),
        ),
      ]
    : [];
  return { day: today, progress, claimed };
}

export function normalizeGameState(input, now = Date.now()) {
  const defaults = createGameState(now);
  const state = { ...defaults, ...input };
  for (const key of [
    "coins",
    "totalEarned",
    "allTimeEarned",
    "totalClicks",
    "allTimeClicks",
    "souls",
    "rebirths",
    "research",
    "relics",
    "sectorResets",
  ]) {
    state[key] = Number.isFinite(state[key]) && state[key] >= 0 ? state[key] : 0;
  }
  if (input?.allTimeClicks === undefined) state.allTimeClicks = state.totalClicks;
  if (state.allTimeClicks < state.totalClicks) state.allTimeClicks = state.totalClicks;
  state.unlocked = Array.isArray(state.unlocked)
    ? [...new Set(state.unlocked.filter((id) => buttonTypes.some((button) => button.id === id)))]
    : ["classic"];
  if (!state.unlocked.includes("classic")) state.unlocked.unshift("classic");
  if (!state.unlocked.includes(state.selected)) state.selected = "classic";
  state.tree = normalizeLevels(state.tree, runNodes);
  state.soulTree = normalizeLevels(state.soulTree, soulNodes);
  state.researchTree = normalizeLevels(state.researchTree, researchNodes);
  state.relicTree = normalizeLevels(state.relicTree, relicNodes);
  state.claimedMilestones = Array.isArray(state.claimedMilestones)
    ? [
        ...new Set(
          state.claimedMilestones.filter((id) =>
            lifetimeMilestones.some((milestone) => milestone.id === id),
          ),
        ),
      ]
    : [];
  state.daily = normalizeDaily(state.daily, now);
  state.legacyMultiplier =
    Number.isInteger(state.legacyMultiplier) && state.legacyMultiplier >= 0
      ? state.legacyMultiplier
      : 0;
  state.lastTickAt = Number.isFinite(state.lastTickAt) ? state.lastTickAt : now;

  if (input?.tree?.finger === undefined && Number.isInteger(input?.powerLevel)) {
    state.tree.finger = Math.max(0, Math.min(25, input.powerLevel));
  }
  if (input?.tree?.bot === undefined && Number.isInteger(input?.autoLevel)) {
    state.tree.bot = Math.max(0, Math.min(30, input.autoLevel));
  }
  if (input?.legacyMultiplier === undefined && Number.isInteger(input?.multiplierLevel)) {
    state.legacyMultiplier = Math.max(0, input.multiplierLevel);
  }
  if (state.allTimeEarned < state.totalEarned) state.allTimeEarned = state.totalEarned;
  return state;
}
