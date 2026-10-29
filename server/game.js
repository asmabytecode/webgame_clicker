import {
  branches,
  buttonTypes,
  dailyContracts,
  lifetimeMilestones,
  relicNodes,
  researchNodes,
  soulNodes,
} from "../shared/gameData.js";
import { clickPower, contractMultiplier, sectorReward, soulReward } from "../shared/gameMath.js";
import { earn, trackDaily } from "./gameEconomy.js";
import { createGameState, normalizeGameState } from "./gameState.js";

export {
  autoRate,
  clickPower,
  contractMultiplier,
  offlineCapSeconds,
  sectorRequirement,
  sectorReward,
  soulReward,
} from "../shared/gameMath.js";
export { accrueAutoIncome } from "./gameEconomy.js";
export { createGameState, normalizeGameState } from "./gameState.js";

const runNodes = branches.flatMap((branch) => branch.nodes);
const nodeById = (nodes, id) => nodes.find((node) => node.id === id);
const level = (state, id) => state.tree[id] || 0;
const soulLevel = (state, id) => state.soulTree[id] || 0;

function resetRun(state, now = Date.now()) {
  const freshRun = createGameState(now);
  Object.assign(state, freshRun, {
    souls: state.souls,
    rebirths: state.rebirths,
    soulTree: state.soulTree,
    research: state.research,
    researchTree: state.researchTree,
    relics: state.relics,
    sectorResets: state.sectorResets,
    relicTree: state.relicTree,
    claimedMilestones: state.claimedMilestones,
    daily: state.daily,
    legacyMultiplier: state.legacyMultiplier,
    allTimeEarned: state.allTimeEarned,
    allTimeClicks: state.allTimeClicks,
    coins: soulLevel(state, "soulStart") * 100 + (state.relicTree.relicStart || 0) * 500,
    lastTickAt: now,
  });
}

function buyUpgrade(state, nodes, treeName, actionId, currencyKey) {
  const node = nodeById(nodes, actionId);
  if (!node) throw Object.assign(new Error("Улучшение не найдено"), { status: 400 });
  const tree = state[treeName];
  const current = tree[node.id] || 0;
  const cost = node.growth
    ? Math.floor(node.baseCost * Math.pow(node.growth, current))
    : node.baseCost + current;
  if (current >= node.max)
    throw Object.assign(new Error("Улучшение уже прокачано до максимума"), { status: 409 });
  if (state[currencyKey] < cost)
    throw Object.assign(new Error("Недостаточно ресурсов"), { status: 409 });
  state[currencyKey] -= cost;
  tree[node.id] = current + 1;
  return node;
}

export function applyGameAction(state, action) {
  switch (action?.type) {
    case "click": {
      const amount = clickPower(state);
      const critical = Math.random() < Math.min(0.5, level(state, "precision") * 0.05);
      let reward = critical ? amount * (2 + level(state, "critical")) : amount;
      const lucky = Math.random() < Math.min(0.5, level(state, "lucky") * 0.05);
      if (lucky) reward *= 3;
      earn(state, reward);
      state.totalClicks++;
      state.allTimeClicks++;
      trackDaily(state, "dailyClicks", 1);
      return { state, reward, critical, lucky };
    }
    case "buyNode": {
      const node = nodeById(runNodes, action.id);
      if (!node) throw Object.assign(new Error("Улучшение не найдено"), { status: 400 });
      const current = level(state, node.id);
      if (current >= node.max)
        throw Object.assign(new Error("Улучшение уже прокачано до максимума"), { status: 409 });
      if (node.prereq && level(state, node.prereq[0]) < node.prereq[1]) {
        throw Object.assign(new Error("Сначала открой предыдущие навыки"), { status: 409 });
      }
      const cost = Math.floor(node.cost * Math.pow(node.growth, current));
      if (state.coins < cost) throw Object.assign(new Error("Недостаточно монет"), { status: 409 });
      state.coins -= cost;
      state.tree[node.id] = current + 1;
      trackDaily(state, "dailyUpgrades", 1);
      return { state };
    }
    case "buySoul": {
      const node = nodeById(soulNodes, action.id);
      if (!node) throw Object.assign(new Error("Улучшение души не найдено"), { status: 400 });
      const current = soulLevel(state, node.id);
      const cost = node.baseCost + current;
      if (current >= node.max)
        throw Object.assign(new Error("Улучшение уже прокачано до максимума"), { status: 409 });
      if (state.souls < cost) throw Object.assign(new Error("Недостаточно душ"), { status: 409 });
      state.souls -= cost;
      state.soulTree[node.id] = current + 1;
      return { state };
    }
    case "buyResearch": {
      const node = buyUpgrade(state, researchNodes, "researchTree", action.id, "research");
      return { state, node };
    }
    case "buyRelic": {
      const node = buyUpgrade(state, relicNodes, "relicTree", action.id, "relics");
      return { state, node };
    }
    case "buyMax": {
      const purchaseTypes = ["buyNode", "buySoul", "buyResearch", "buyRelic"];
      if (!purchaseTypes.includes(action.purchaseType)) {
        throw Object.assign(new Error("Тип улучшения не найден"), { status: 400 });
      }

      let purchases = 0;
      while (purchases < 100) {
        try {
          applyGameAction(state, { type: action.purchaseType, id: action.id });
          purchases++;
        } catch (error) {
          if (purchases > 0 && error.status === 409) break;
          throw error;
        }
      }
      return { state, purchases };
    }
    case "claimContract": {
      const contract = nodeById(dailyContracts, action.id);
      if (!contract) throw Object.assign(new Error("Контракт не найден"), { status: 400 });
      if (state.daily.claimed.includes(contract.id)) {
        throw Object.assign(new Error("Этот контракт уже получен сегодня"), { status: 409 });
      }
      if (state.daily.progress[contract.id] < contract.target) {
        throw Object.assign(new Error("Сначала выполни контракт"), { status: 409 });
      }
      const multiplier = contractMultiplier(state);
      const researchReward = Math.max(1, Math.floor(contract.rewardData * multiplier));
      const coinReward = Math.floor(contract.rewardCoins * multiplier);
      state.daily.claimed.push(contract.id);
      state.research += researchReward;
      earn(state, coinReward, { countForDaily: false });
      return { state, researchReward, coinReward };
    }
    case "claimMilestone": {
      const milestone = nodeById(lifetimeMilestones, action.id);
      if (!milestone) throw Object.assign(new Error("Этап не найден"), { status: 400 });
      if (state.claimedMilestones.includes(milestone.id)) {
        throw Object.assign(new Error("Награда за этот этап уже получена"), { status: 409 });
      }
      if (state.allTimeEarned < milestone.target) {
        throw Object.assign(new Error("Этап ещё не пройден"), { status: 409 });
      }
      state.claimedMilestones.push(milestone.id);
      state.relics += milestone.reward;
      return { state, reward: milestone.reward };
    }
    case "chooseSkin": {
      const button = nodeById(buttonTypes, action.id);
      if (!button) throw Object.assign(new Error("Кнопка не найдена"), { status: 400 });
      if (!state.unlocked.includes(button.id)) {
        if (state.coins < button.cost)
          throw Object.assign(new Error("Недостаточно монет"), { status: 409 });
        state.coins -= button.cost;
        state.unlocked.push(button.id);
      }
      state.selected = button.id;
      return { state };
    }
    case "rebirth": {
      const reward = soulReward(state);
      if (reward < 1)
        throw Object.assign(new Error("Нужно заработать не менее 10 000 монет за забег"), {
          status: 409,
        });
      state.souls += reward;
      state.rebirths++;
      resetRun(state);
      return { state, reward };
    }
    case "sectorReset": {
      const reward = sectorReward(state);
      if (reward < 1)
        throw Object.assign(
          new Error("Для экспедиции нужно заработать не менее 50 000 монет за забег"),
          { status: 409 },
        );
      state.relics += reward;
      state.sectorResets++;
      resetRun(state);
      return { state, reward };
    }
    case "reset": {
      for (const key of Object.keys(state)) delete state[key];
      Object.assign(state, createGameState());
      return { state };
    }
    default:
      throw Object.assign(new Error("Неизвестное действие"), { status: 400 });
  }
}
