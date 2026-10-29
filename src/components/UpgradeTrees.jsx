import { getLevel, getSoulLevel, format } from "../lib/gameMath.js";

export function UpgradeBranch({ branch, state, onBuy }) {
  const upgraded = branch.nodes.reduce((sum, node) => sum + getLevel(state, node.id), 0);

  return (
    <details
      className={`tree-branch ${branch.id === "auto" ? "auto-branch" : ""}`}
      open={branch.id === "auto"}
    >
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
            const prerequisite = node.prereq
              ? `Нужно: ${branch.nodes.find((item) => item.id === node.prereq[0])?.name || node.prereq[0]} ур. ${node.prereq[1]}`
              : "";

            return (
              <div className="tree-step upgrade-actions" key={node.id}>
                {index > 0 && (
                  <div className="branch-arrow" aria-hidden="true">
                    ↓
                  </div>
                )}
                <button
                  className={`tree-node upgrade-buy-button currency-cr ${level ? "purchased" : ""}`}
                  type="button"
                  disabled={!available}
                  title={!unlocked ? prerequisite : undefined}
                  onClick={() => onBuy("buyNode", node.id)}
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
                </button>
                <button
                  className="buy-max-button currency-cr"
                  type="button"
                  disabled={!available || level >= node.max}
                  aria-label={`Купить максимум: ${node.name}`}
                  title="Купить до максимального уровня"
                  onClick={() => onBuy("buyMax", node.id, { purchaseType: "buyNode" })}
                >
                  MAX
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </details>
  );
}

function UpgradeCard({ node, level, cost, currency, available, onBuy, action }) {
  const currencyClass = currency.toLowerCase();

  return (
    <div className="upgrade-actions">
      <button
        className={`soul-node permanent-node currency-${currencyClass} ${level ? "purchased" : ""}`}
        type="button"
        disabled={!available}
        onClick={() => onBuy(action, node.id)}
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
      </button>
      <button
        className={`buy-max-button currency-${currencyClass}`}
        type="button"
        disabled={!available || level >= node.max}
        aria-label={`Купить максимум: ${node.name}`}
        title="Купить до максимального уровня"
        onClick={() => onBuy("buyMax", node.id, { purchaseType: action })}
      >
        MAX
      </button>
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
