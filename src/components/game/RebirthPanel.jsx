import { soulNodes } from "../../../shared/gameData.js";
import { SoulUpgrade } from "../UpgradeTrees.jsx";
import { format } from "../../lib/gameMath.js";

export default function RebirthPanel({ state, view, onAction }) {
  function rebirth() {
    if (
      window.confirm(
        `Возродиться и получить ${format(view.soulsToEarn)} душ? Кредиты, кнопки и древо текущего забега сбросятся.`,
      )
    ) {
      onAction("rebirth");
    }
  }

  return (
    <section className="panel rebirth-panel" aria-label="Возрождение">
      <div className="rebirth-heading">
        <div>
          <span className="eyebrow">СБРОС I · МЯГКИЙ ПРЕСТИЖ</span>
          <h2>Возрождение</h2>
          <p>Сбрасывает кредиты, кнопки и дерево забега. Сохраняет исследования и реликвии.</p>
        </div>
        <div className="soul-badge">SOUL · {format(state.souls)}</div>
      </div>
      <div className="rebirth-info">
        <div className="rebirth-copy">
          <strong>Сбросится:</strong> кредит, кнопки и навыки текущего забега.
          <br />
          <strong>Сохранится:</strong> души, исследования, реликвии и журнал кампании.
          <br />
          {view.canRebirth
            ? `Расчётная награда: ${format(view.soulsToEarn)} душ · заработано ${format(state.totalEarned)} CR.`
            : `Прогресс: ${format(state.totalEarned)} / ${format(view.soulThreshold)} CR · следующая душа.`}
          <div className="rebirth-progress">
            <div
              style={{
                width: `${Math.min(100, (state.totalEarned / view.soulThreshold) * 100)}%`,
              }}
            />
          </div>
        </div>
        <button
          className="rebirth-button"
          type="button"
          disabled={!view.canRebirth}
          onClick={rebirth}
        >
          {view.canRebirth
            ? `Возродиться · +${format(view.soulsToEarn)} SOUL`
            : "Возрождение недоступно"}
        </button>
      </div>
      <div className="soul-section">
        <h3 className="soul-title">Вечные улучшения · SOUL</h3>
        <div className="soul-tree">
          {soulNodes.map((node) => (
            <SoulUpgrade key={node.id} node={node} state={state} onBuy={onAction} />
          ))}
        </div>
      </div>
    </section>
  );
}
