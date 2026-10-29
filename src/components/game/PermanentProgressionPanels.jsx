import { relicNodes, researchNodes } from "../../../shared/gameData.js";
import { format } from "../../lib/gameMath.js";
import { PermanentUpgrade } from "./UpgradeTrees.jsx";

export function SectorResetPanel({ state, view, onAction }) {
  function resetSector() {
    if (
      window.confirm(
        `Сменить сектор и получить ${format(view.sectorRewardAmount)} реликвий? Кредиты и улучшения текущего забега сбросятся.`,
      )
    ) {
      onAction("sectorReset");
    }
  }

  return (
    <section className="panel progression-panel">
      <div className="progression-heading">
        <div>
          <span className="eyebrow">СБРОС II · ЭКСПЕДИЦИЯ</span>
          <h2>Смена сектора</h2>
        </div>
        <div className="resource-chip relic-chip">RELIC · {format(state.relics)}</div>
      </div>
      <div className="reset-layout">
        <div className="reset-explanation">
          <strong>Порог следующего уровня награды: {format(view.sectorThreshold)} CR.</strong>
          <span>
            {view.sectorRewardAmount > 0
              ? `Сейчас можно получить ${format(view.sectorRewardAmount)} реликвий за этот забег.`
              : `Прогресс: ${format(state.totalEarned)} / ${format(view.sectorThreshold)} CR.`}
          </span>
        </div>
        <button
          className="rebirth-button sector-button"
          type="button"
          disabled={view.sectorRewardAmount < 1}
          onClick={resetSector}
        >
          {view.sectorRewardAmount > 0
            ? `Сменить сектор · +${format(view.sectorRewardAmount)} RELIC`
            : "Смена сектора недоступна"}
        </button>
      </div>
      <div className="permanent-tree">
        <h3>Артефактная мастерская · RELIC</h3>
        <div className="soul-tree">
          {relicNodes.map((node) => (
            <PermanentUpgrade
              key={node.id}
              node={node}
              state={state}
              currency="relics"
              onBuy={onAction}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ResearchPanel({ state, onAction }) {
  return (
    <section className="panel progression-panel research-panel">
      <div className="progression-heading">
        <div>
          <span className="eyebrow">ПОСТОЯННОЕ РАЗВИТИЕ</span>
          <h2>Лаборатория</h2>
        </div>
        <div className="resource-chip data-chip">DATA · {format(state.research)}</div>
      </div>
      <div className="soul-tree">
        {researchNodes.map((node) => (
          <PermanentUpgrade
            key={node.id}
            node={node}
            state={state}
            currency="research"
            onBuy={onAction}
          />
        ))}
      </div>
      <p className="offline-note">
        Офлайн-доход ограничен 8 часами; улучшения архива увеличивают предел, но не более 24 часов.
      </p>
    </section>
  );
}
