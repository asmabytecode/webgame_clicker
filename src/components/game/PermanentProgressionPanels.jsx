import { format } from "../../lib/gameMath.js";

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
    </section>
  );
}
