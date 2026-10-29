import { getLevel, getSoulLevel, format } from "../../lib/gameMath.js";

export function UpgradeBranch({ branch, state, onBuy }) {
  const upgraded = branch.nodes.reduce((sum, node) => sum + getLevel(state, node.id), 0);

  return (
    <details className={`tree-branch ${branch.id === "auto" ? "auto-branch" : ""}`} open>
      <summary className="branch-title">
        <span>{branch.icon}</span>
        <span className="branch-label">{branch.title}</span>
        <span className="branch-status">{upgraded} ур.</span>
      </summary>
      <div className="branch-content">
        <div className="branch-nodes">
          {branch.nodes.map((node, index) => {
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
                className={`tree-step upgrade-card ${unlocked ? "node-unlocked" : "node-locked"}`}
                key={node.id}
              >
                {index > 0 && (
                  <div className="branch-arrow" aria-hidden="true">
                    ↓
                  </div>
                )}
                <div
                  className={`node-route ${node.prereq ? "has-prerequisite" : "branch-start"} ${unlocked ? "route-open" : "route-locked"}`}
                  title={
                    node.prereq ? `${prerequisite} → ${node.name}` : `Начало ветки → ${node.name}`
                  }
                >
                  <span className="route-source">
                    {parentNode
                      ? `${parentNode.icon} ${parentNode.name} · ур. ${node.prereq[1]}`
                      : "СТАРТ ВЕТКИ"}
                  </span>
                  <span className="route-line" aria-hidden="true">
                    <span>›</span>
                  </span>
                </div>
                <div
                  className={`tree-node currency-cr ${level ? "purchased" : ""}`}
                  title={!unlocked ? prerequisite : node.description}
                >
                  <span className="node-icon">{node.icon}</span>
                  <span className="node-copy">
                    <span className="node-name">{node.name}</span>
                    <span className="node-desc">
                      {node.description}
                      {!unlocked ? ` · ${prerequisite}` : ""}
                    </span>
                  </span>
                  <span className="node-meta">
                    {level >= node.max ? "МАКС" : `${format(cost)} CR`}
                    <small>
                      {level}/{node.max}
                    </small>
                  </span>
                </div>
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
    </details>
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
  const treeName = currency === "research" ? "researchTree" : "relicTree";
  const level = state[treeName][node.id] || 0;
  const cost = node.growth
    ? Math.floor(node.baseCost * node.growth ** level)
    : node.baseCost + level;
  const available = level < node.max && state[currency] >= cost;
  const displayCurrency = currency === "research" ? "DATA" : "RELIC";
  const action = currency === "research" ? "buyResearch" : "buyRelic";

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
