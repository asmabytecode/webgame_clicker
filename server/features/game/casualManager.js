import {
  achievements,
  ascensionNodes,
  artifacts,
  bossHealth,
  branches,
  campaignChapters,
  lifetimeMilestones,
  relicNodes,
  soulNodes,
} from "../../../shared/game/gameData.js";
import {
  ascensionReward,
  autoRate,
  clickPower,
  offlineCapSeconds,
  sectorReward,
  soulReward,
} from "../../../shared/game/gameMath.js";
import { applyGameAction } from "./game.js";

const runNodes = branches.flatMap((branch) => branch.nodes);
const purchaseLimit = 8;
const planProbe = { bot: 5, swarm: 3, drone: 1 };
const currencyTrees = [
  { action: "buySoul", currency: "souls", nodes: soulNodes, tree: "soulTree" },
  { action: "buyRelic", currency: "relics", nodes: relicNodes, tree: "relicTree" },
  {
    action: "buyAscension",
    currency: "ascensionCores",
    nodes: ascensionNodes,
    tree: "ascensionTree",
  },
];

function nodeCost(node, level) {
  return node.growth ? Math.floor(node.baseCost * node.growth ** level) : node.baseCost + level;
}

function withPlanProbe(state) {
  return {
    ...state,
    tree: {
      ...state.tree,
      bot: Math.max(state.tree.bot || 0, planProbe.bot),
      swarm: Math.max(state.tree.swarm || 0, planProbe.swarm),
      drone: Math.max(state.tree.drone || 0, planProbe.drone),
    },
  };
}

function estimateUpgradeValue(state, candidate) {
  const { action, currency, node, tree } = candidate;
  const level = tree[node.id] || 0;
  const cost = candidate.cost ?? nodeCost(node, level);
  const projected = withPlanProbe(state);
  const projectedAuto = autoRate(projected);
  const projectedClick = clickPower(projected);
  const upgraded = {
    ...projected,
    [currency]: Math.max(0, (projected[currency] || 0) - cost),
    [candidate.treeName]: { ...projected[candidate.treeName], [node.id]: level + 1 },
  };
  const autoGain = Math.max(0, autoRate(upgraded) - projectedAuto);
  const clickGain = Math.max(0, clickPower(upgraded) - projectedClick);
  const offlineGain =
    Math.max(0, offlineCapSeconds(upgraded) - offlineCapSeconds(projected)) / 3600;
  const startCapital =
    node.id === "soulStart" || node.id === "relicStart" || node.id === "ascensionStart"
      ? node.id === "soulStart"
        ? 1000
        : node.id === "relicStart"
          ? 5000
          : 10000
      : 0;
  const soulGain =
    node.id === "relicSouls" || node.id === "ascensionSouls"
      ? Math.max(
          0,
          soulReward({ ...upgraded, totalEarned: 100_000 }) -
            soulReward({ ...projected, totalEarned: 100_000 }),
        )
      : 0;
  const value =
    autoGain +
    clickGain * 0.025 +
    offlineGain * projectedAuto * 0.015 +
    (startCapital * projectedAuto) / 100_000 +
    soulGain * Math.max(projectedAuto, 1) * 0.05;

  return { cost, value, score: value / Math.max(cost, 1) };
}

function getCandidates(state, treeConfig, { affordableOnly = false } = {}) {
  const levels = state[treeConfig.tree] || {};
  const currencyBalance = state[treeConfig.currency] || 0;
  return treeConfig.nodes
    .map((node) => {
      const level = levels[node.id] || 0;
      if (level >= node.max) return null;
      if (treeConfig.run && node.prereq && (state.tree[node.prereq[0]] || 0) < node.prereq[1]) {
        return null;
      }
      const candidate = {
        action: treeConfig.action,
        currency: treeConfig.currency,
        node,
        tree: levels,
        treeName: treeConfig.tree,
        cost: treeConfig.run ? Math.floor(node.cost * node.growth ** level) : nodeCost(node, level),
      };
      const estimate = estimateUpgradeValue(state, candidate);
      if (affordableOnly && currencyBalance < estimate.cost) return null;
      return { ...candidate, ...estimate };
    })
    .filter(Boolean)
    .sort((left, right) => right.score - left.score);
}

function bestCandidate(state, treeConfig) {
  const affordable = getCandidates(state, treeConfig, { affordableOnly: true })[0];
  if (!affordable) return null;
  const bestOverall = getCandidates(state, treeConfig)[0];
  if (bestOverall && bestOverall.cost > (state[treeConfig.currency] || 0)) {
    if (bestOverall.score > affordable.score * 1.25) {
      return { ...affordable, savingFor: bestOverall };
    }
  }
  return affordable;
}

function hasUnlockedArtifact(state, effect) {
  return artifacts.find(
    (artifact) => artifact.effect === effect && state.ownedArtifacts.includes(artifact.id),
  );
}

function claimAvailableRewards(state) {
  let claims = 0;
  for (const milestone of lifetimeMilestones) {
    if (
      state.allTimeEarned >= milestone.target &&
      !state.claimedMilestones.includes(milestone.id)
    ) {
      applyGameAction(state, { type: "claimMilestone", id: milestone.id });
      claims++;
    }
  }
  for (const achievement of achievements) {
    if (
      state[achievement.stat] >= achievement.target &&
      !state.claimedAchievements.includes(achievement.id)
    ) {
      applyGameAction(state, { type: "claimAchievement", id: achievement.id });
      claims++;
    }
  }
  for (const chapter of campaignChapters) {
    if (state.allTimeEarned >= chapter.target && !state.claimedChapters.includes(chapter.id)) {
      applyGameAction(state, { type: "claimChapter", id: chapter.id });
      claims++;
    }
  }
  if (state.bossDamage >= bossHealth(state.bossesDefeated)) {
    applyGameAction(state, { type: "claimBoss" });
    claims++;
  }
  return claims;
}

function createPrestigeProjection(state, kind, reward) {
  const projection = {
    ...state,
    coins:
      (state.soulTree.soulStart || 0) * 1000 +
      (state.relicTree.relicStart || 0) * 5000 +
      (state.ascensionTree.ascensionStart || 0) * 10000,
    totalEarned: 0,
    tree: Object.fromEntries(runNodes.map((node) => [node.id, 0])),
    selected: "classic",
    unlocked: ["classic"],
  };

  if (kind === "rebirth") {
    projection.souls += reward;
    projection.rebirths++;
  } else if (kind === "sectorReset") {
    projection.relics += reward;
    projection.sectorResets++;
  } else {
    projection.ascensionCores += reward;
    projection.ascensions++;
  }

  return projection;
}

function projectedIncome(state) {
  const projection = createPrestigeProjection(state, "preview", 0);
  const probe = withPlanProbe(projection);
  for (let purchase = 0; purchase < 24; purchase++) {
    const candidates = currencyTrees.flatMap((treeConfig) =>
      getCandidates(probe, treeConfig, { affordableOnly: true }),
    );
    const best = candidates.sort((left, right) => right.score - left.score)[0];
    if (!best || best.value <= 0) break;
    probe[best.currency] -= best.cost;
    probe[best.treeName][best.node.id]++;
  }
  return autoRate(probe);
}

function bestPrestige(state) {
  const options = [
    { type: "ascend", kind: "ascend", reward: ascensionReward(state), tier: 3 },
    { type: "sectorReset", kind: "sectorReset", reward: sectorReward(state), tier: 2 },
    { type: "rebirth", kind: "rebirth", reward: soulReward(state), tier: 1 },
  ].filter((option) => option.reward > 0 && (option.type !== "ascend" || state.rebirths > 0));

  return options
    .map((option) => ({
      ...option,
      projectedIncome: projectedIncome(createPrestigeProjection(state, option.kind, option.reward)),
    }))
    .sort(
      (left, right) => right.projectedIncome - left.projectedIncome || right.tier - left.tier,
    )[0];
}

function nextPrestigePlan(state) {
  const rate = Math.max(autoRate(state), 0.01);
  const soulMultiplier =
    (1 + (state.relicTree.relicSouls || 0) * 0.12) *
    (1 + (state.ascensionTree.ascensionSouls || 0) * 0.2) *
    (state.activeArtifact === "artifactSoul" ? 1.15 : 1);
  const nextSoulReward = soulReward(state) + 1;
  const thresholds = [
    {
      label: "возрождение",
      currency: "CR",
      amount: Math.ceil((nextSoulReward / soulMultiplier) ** 2 * 10_000),
      enabled: true,
    },
    {
      label: "смена сектора",
      currency: "CR",
      amount: (sectorReward(state) + 1) ** 2 * 50_000,
      enabled: true,
    },
    {
      label: "вознесение",
      currency: "CR",
      amount: (ascensionReward(state) + 1) ** 2 * 1_000_000,
      enabled: state.rebirths > 0,
    },
  ]
    .filter((target) => target.enabled)
    .sort(
      (left, right) =>
        Math.max(0, left.amount - state.totalEarned) -
        Math.max(0, right.amount - state.totalEarned),
    )[0];

  return thresholds
    ? `Коплю на ${thresholds.label}: ещё примерно ${Math.ceil(
        Math.max(0, thresholds.amount - state.totalEarned) / rate,
      )} сек. автодохода.`
    : "Накопи CR: вознесение откроется после первого возрождения.";
}

function buyPersistentUpgrades(state, events) {
  let purchases = 0;
  for (const treeConfig of currencyTrees) {
    for (let count = 0; count < purchaseLimit; count++) {
      const candidate = bestCandidate(state, treeConfig);
      if (!candidate) break;
      if (candidate.savingFor) {
        events.push(
          `Коплю ${treeConfig.currency} на «${candidate.savingFor.node.name}» — это выгоднее.`,
        );
        break;
      }
      applyGameAction(state, { type: treeConfig.action, id: candidate.node.id });
      events.push(`Улучшено: ${candidate.node.name}.`);
      purchases++;
    }
  }
  return purchases;
}

function buyRunUpgrades(state, events) {
  let purchases = 0;
  const config = {
    action: "buyNode",
    currency: "coins",
    nodes: runNodes,
    tree: "tree",
    run: true,
  };
  for (; purchases < purchaseLimit; purchases++) {
    const candidate = bestCandidate(state, config);
    if (!candidate) {
      const next = getCandidates(state, config)[0];
      events.push(
        next
          ? `Коплю на улучшение «${next.node.name}»: ещё ${Math.max(0, next.cost - state.coins)} CR.`
          : "Улучшения забега прокачаны до максимума; коплю на престиж.",
      );
      break;
    }
    if (candidate.savingFor) {
      events.push(
        `Коплю на «${candidate.savingFor.node.name}»: его прирост выгоднее покупки сейчас.`,
      );
      break;
    }
    applyGameAction(state, { type: "buyNode", id: candidate.node.id });
    events.push(`Улучшено: ${candidate.node.name}.`);
  }
  return purchases;
}

export function runCasualAutomation(state) {
  const events = [];
  const claims = claimAvailableRewards(state);
  if (claims) events.push(`Забрано наград: ${claims}.`);

  const autoArtifact = hasUnlockedArtifact(state, "auto");
  if (autoArtifact && state.activeArtifact !== autoArtifact.id) {
    applyGameAction(state, { type: "equipArtifact", id: autoArtifact.id });
    events.push(`Выбран артефакт «${autoArtifact.name}».`);
  }

  const permanentPurchases = buyPersistentUpgrades(state, events);
  const prestige = bestPrestige(state);
  if (prestige) {
    applyGameAction(state, { type: prestige.type });
    const label =
      prestige.type === "ascend"
        ? "вознесение"
        : prestige.type === "sectorReset"
          ? "смена сектора"
          : "возрождение";
    const currency =
      prestige.type === "ascend" ? "CORE" : prestige.type === "sectorReset" ? "RELIC" : "SOUL";
    state.casualStatus = `Выгоднее ${label}: +${prestige.reward} ${currency}. Сброс выполнен, постоянные улучшения сохранены.`;
    return { claims, purchases: permanentPurchases, prestige: prestige.type };
  }

  const runPurchases = buyRunUpgrades(state, events);
  if (runPurchases > 0) {
    state.casualStatus = events.slice(-3).join(" ");
  } else if (events.length > 0) {
    state.casualStatus = events.slice(-3).join(" ");
  } else {
    state.casualStatus = nextPrestigePlan(state);
  }

  return { claims, purchases: permanentPurchases + runPurchases, prestige: null };
}
