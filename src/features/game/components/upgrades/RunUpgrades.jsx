import { useState } from "react";
import { branches } from "@shared/game/gameData.js";
import { format } from "@/features/game/lib/gameMath.js";
import { UpgradeBranch } from "./UpgradeTrees.jsx";

export default function RunUpgrades({ state, onBuy }) {
  const [activeBranchId, setActiveBranchId] = useState("auto");
  const activeBranch = branches.find((branch) => branch.id === activeBranchId) || branches[0];

  function branchProgress(branch) {
    const level = branch.nodes.reduce((sum, node) => sum + (state.tree[node.id] || 0), 0);
    const maximum = branch.nodes.reduce((sum, node) => sum + node.max, 0);
    return { level, maximum };
  }

  return (
    <section className="panel tree-panel" id="upgrade-tree" aria-label="Древо производства">
      <div className="tree-heading">
        <div>
          <span className="eyebrow">ЗАБЕГ · СБРОС ПРИ ПРЕСТИЖЕ</span>
          <h2>Улучшения</h2>
          <p>Выбери направление, затем открой нужную группу улучшений.</p>
        </div>
        <div className="tree-currency">{format(state.coins)} CR</div>
      </div>
      <div className="tree-category-nav" role="tablist" aria-label="Направления улучшений">
        {branches.map((branch) => {
          const progress = branchProgress(branch);
          const selected = branch.id === activeBranch.id;
          return (
            <button
              className={`tree-category-tab ${selected ? "active" : ""}`}
              id={`tree-category-${branch.id}`}
              key={branch.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="tree-category-panel"
              onClick={() => setActiveBranchId(branch.id)}
            >
              <span className="tree-category-icon" aria-hidden="true">
                {branch.icon}
              </span>
              <span className="tree-category-copy">
                <strong>{branch.title}</strong>
                <small>
                  {progress.level} / {progress.maximum} ур.
                </small>
              </span>
            </button>
          );
        })}
      </div>
      <div
        className="tree-category-panel"
        id="tree-category-panel"
        role="tabpanel"
        aria-labelledby={`tree-category-${activeBranch.id}`}
      >
        <UpgradeBranch key={activeBranch.id} branch={activeBranch} state={state} onBuy={onBuy} />
      </div>
    </section>
  );
}
