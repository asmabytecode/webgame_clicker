import { useState } from "react";
import { getLevel, getSoulLevel, format } from "@/features/game/lib/gameMath.js";

export function UpgradeBranch({ branch, state, onBuy }) {
  const [activeGroupId, setActiveGroupId] = useState(branch.groups[0].id);
  const activeGroup = branch.groups.find((group) => group.id === activeGroupId) || branch.groups[0];
  const groupNodes = activeGroup.nodes.map((id) => branch.nodes.find((node) => node.id === id));
  const upgraded = groupNodes.reduce((sum, node) => sum + getLevel(state, node.id), 0);
  const maximum = groupNodes.reduce((sum, node) => sum + node.max, 0);

  return (
    <section className={`tree-branch ${branch.id === "auto" ? "auto-branch" : ""}`}>
      <header className="tree-branch-heading">
        <div>
          <span className="eyebrow">{branch.icon} НАПРАВЛЕНИЕ</span>
          <h3>{branch.title}</h3>
          <p>{branch.description}</p>
        </div>
        <span className="branch-status">
          ГРУППА · {upgraded}/{maximum} ур.
        </span>
      </header>
      <div className="tree-function-nav" role="tablist" aria-label={`Группы: ${branch.title}`}>
        {branch.groups.map((group) => {
          const groupLevel = group.nodes.reduce((sum, id) => sum + getLevel(state, id), 0);
          const groupMaximum = group.nodes.reduce(
            (sum, id) => sum + branch.nodes.find((node) => node.id === id).max,
            0,
          );
          const selected = group.id === activeGroup.id;
          return (
            <button
              className={`tree-function-tab ${selected ? "active" : ""}`}
              id={`tree-function-${branch.id}-${group.id}`}
              key={group.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`tree-function-panel-${branch.id}`}
              onClick={() => setActiveGroupId(group.id)}
            >
              <strong>{group.title}</strong>
              <small>
                {groupLevel}/{groupMaximum} ур.
              </small>
            </button>
          );
        })}
      </div>
      <div
        className="tree-function-panel"
        id={`tree-function-panel-${branch.id}`}
        role="tabpanel"
        aria-labelledby={`tree-function-${branch.id}-${activeGroup.id}`}
      >
        <p className="tree-function-description">{activeGroup.description}</p>
        <div className="branch-nodes">
          {groupNodes.map((node) => {
            const level = getLevel(state, node.id);
            const cost = Math.floor(node.cost * node.growth ** level);
            const unlocked = !node.prereq || getLevel(state, node.prereq[0]) >= node.prereq[1];
            const available = unlocked && level < node.max && state.coins >= cost;
            const parentNode = node.prereq
              ? branch.nodes.find((item) => item.id === node.prereq[0])
              : null;
            const prerequisite = node.prereq
              ? `Нужно: ${parentNode?.name || node.prereq[0]} ур. ${node.prereq[1]}`
              : "";

            return (
              <div
                className={`tree-step upgrade-card ${unlocked ? "node-unlocked" : "node-locked"} ${available ? "node-affordable" : ""}`}
                key={node.id}
              >
                <div
                  className={`node-route ${node.prereq ? "has-prerequisite" : "branch-start"} ${unlocked ? "route-open" : "route-locked"}`}
                >
                  <span className="route-source">
                    {parentNode
                      ? unlocked
                        ? `ОТКРЫТО · ${parentNode.name} ур. ${node.prereq[1]}`
                        : `ЗАМОК · ${parentNode.name} ур. ${node.prereq[1]}`
                      : "СТАРТОВОЕ УЛУЧШЕНИЕ"}
                  </span>
                  {node.prereq && (
                    <span className="node-lock-indicator">{unlocked ? "✓" : "🔒"}</span>
                  )}
                </div>
                <div
                  className={`tree-node currency-cr ${level ? "purchased" : ""}`}
                  title={!unlocked ? prerequisite : node.description}
                >
                  <span className="node-icon">{node.icon}</span>
                  <span className="node-copy">
                    <span className="node-name">{node.name}</span>
                    <span className="node-desc">{node.description}</span>
                  </span>
                  <span className="node-meta">
                    {level >= node.max ? "МАКС" : `${format(cost)} CR`}
                    <small>
                      {level}/{node.max}
                    </small>
                  </span>
                </div>
                <span
                  className={`node-availability ${level >= node.max ? "is-max" : unlocked ? "" : "is-locked"}`}
                >
                  {level >= node.max
                    ? "Максимальный уровень"
                    : !unlocked
                      ? prerequisite
                      : state.coins < cost
                        ? `Не хватает ${format(cost - state.coins)} CR`
                        : "Можно улучшить"}
                </span>
                <UpgradeActions
                  node={node}
                  currency="cr"
                  available={available}
                  onBuy={() => onBuy("buyNode", node.id)}
                  onBuyMax={() => onBuy("buyMax", node.id, { purchaseType: "buyNode" })}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function UpgradeActions({ node, currency, available, onBuy, onBuyMax }) {
  return (
    <div className="upgrade-card-actions">
      <button
        className={`upgrade-one-button currency-${currency}`}
        type="button"
        disabled={!available}
        aria-label={`Купить один уровень: ${node.name}`}
        title="Купить ровно один уровень"
        onClick={onBuy}
      >
        +1 уровень
      </button>
      <button
        className={`buy-max-button currency-${currency}`}
        type="button"
        disabled={!available}
        aria-label={`Купить максимум: ${node.name}`}
        title="Купить все доступные уровни"
        onClick={onBuyMax}
      >
        MAX
      </button>
    </div>
  );
}

function UpgradeCard({ node, level, cost, currency, available, onBuy, action }) {
  const currencyClass = currency.toLowerCase();

  return (
    <div className={`upgrade-card currency-${currencyClass}`}>
      <div
        className={`soul-node permanent-node ${level ? "purchased" : ""}`}
        title={node.description}
      >
        <span className="node-icon">{node.icon}</span>
        <span className="node-copy">
          <span className="node-name">{node.name}</span>
          <span className="node-desc">{node.description}</span>
        </span>
        <span className="node-meta">
          {level >= node.max ? "МАКС" : `${format(cost)} ${currency}`}
          <small>
            {level}/{node.max}
          </small>
        </span>
      </div>
      <UpgradeActions
        node={node}
        currency={currencyClass}
        available={available}
        onBuy={() => onBuy(action, node.id)}
        onBuyMax={() => onBuy("buyMax", node.id, { purchaseType: action })}
      />
    </div>
  );
}

export function PermanentUpgradeTabs({ groups, nodes, state, onBuy, currency }) {
  const [activeGroupId, setActiveGroupId] = useState(groups[0].title);
  const activeGroup = groups.find((group) => group.title === activeGroupId) || groups[0];
  const groupNodes = activeGroup.nodes.map((id) => nodes.find((node) => node.id === id));
  const tree =
    currency === "souls"
      ? state.soulTree
      : currency === "relics"
        ? state.relicTree
        : state.ascensionTree;

  return (
    <div className="permanent-upgrade-tabs">
      <div className="tree-function-nav" role="tablist" aria-label="Группы постоянных улучшений">
        {groups.map((group) => {
          const groupLevel = group.nodes.reduce((sum, id) => sum + (tree[id] || 0), 0);
          const groupMaximum = group.nodes.reduce(
            (sum, id) => sum + nodes.find((node) => node.id === id).max,
            0,
          );
          const selected = group.title === activeGroup.title;
          const tabId = `permanent-group-${currency}-${groups.indexOf(group)}`;
          return (
            <button
              className={`tree-function-tab ${selected ? "active" : ""}`}
              id={tabId}
              key={group.title}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`permanent-panel-${currency}`}
              onClick={() => setActiveGroupId(group.title)}
            >
              <strong>{group.title}</strong>
              <small>
                {groupLevel}/{groupMaximum} ур.
              </small>
            </button>
          );
        })}
      </div>
      <div
        className="permanent-upgrade-panel-content"
        id={`permanent-panel-${currency}`}
        role="tabpanel"
        aria-labelledby={`permanent-group-${currency}-${groups.indexOf(activeGroup)}`}
      >
        <p className="tree-function-description">{activeGroup.description}</p>
        <div className="permanent-upgrade-grid">
          {groupNodes.map((node) =>
            currency === "souls" ? (
              <SoulUpgrade key={node.id} node={node} state={state} onBuy={onBuy} />
            ) : (
              <PermanentUpgrade
                key={node.id}
                node={node}
                state={state}
                currency={currency}
                onBuy={onBuy}
              />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

export function SoulUpgrade({ node, state, onBuy }) {
  const level = getSoulLevel(state, node.id);
  const cost = node.baseCost + level;
  const available = level < node.max && state.souls >= cost;

  return (
    <UpgradeCard
      node={node}
      level={level}
      cost={cost}
      currency="SOUL"
      available={available}
      onBuy={onBuy}
      action="buySoul"
    />
  );
}

export function PermanentUpgrade({ node, state, currency, onBuy }) {
  const treeName = currency === "ascensionCores" ? "ascensionTree" : "relicTree";
  const level = state[treeName][node.id] || 0;
  const cost = node.growth
    ? Math.floor(node.baseCost * node.growth ** level)
    : node.baseCost + level;
  const available = level < node.max && state[currency] >= cost;
  const displayCurrency = currency === "ascensionCores" ? "CORE" : "RELIC";
  const action = currency === "ascensionCores" ? "buyAscension" : "buyRelic";

  return (
    <UpgradeCard
      node={node}
      level={level}
      cost={cost}
      currency={displayCurrency}
      available={available}
      onBuy={onBuy}
      action={action}
    />
  );
}
