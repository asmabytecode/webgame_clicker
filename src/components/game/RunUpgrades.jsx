import { branches } from "../../../shared/gameData.js";
import { format } from "../../lib/gameMath.js";
import { UpgradeBranch } from "./UpgradeTrees.jsx";

const orderedBranches = [
  ...branches.filter((branch) => branch.id === "auto"),
  ...branches.filter((branch) => branch.id !== "auto"),
];

export default function RunUpgrades({ state, onBuy }) {
  return (
    <section className="panel tree-panel" id="upgrade-tree" aria-label="Древо производства">
      <div className="tree-heading">
        <div>
          <span className="eyebrow">ЗАБЕГ · СБРОС ПРИ ПРЕСТИЖЕ</span>
          <h2>Улучшения</h2>
        </div>
        <div className="tree-currency">{format(state.coins)} CR</div>
      </div>
      <div className="tree-columns">
        {orderedBranches.map((branch) => (
          <UpgradeBranch key={branch.id} branch={branch} state={state} onBuy={onBuy} />
        ))}
      </div>
    </section>
  );
}
