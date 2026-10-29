import { format } from "../../lib/gameMath.js";

export default function AutomationPanel({ state, view }) {
  return (
    <section className="panel automation-panel" aria-label="Автоматическая добыча">
      <div className="automation-heading">
        <span className="eyebrow">ПРОИЗВОДСТВО · РАБОТАЕТ САМО</span>
        <h2>Автодоход</h2>
      </div>
      <div className="automation-output">
        <strong>{format(view.automaticIncome)}</strong>
        <span>CR / сек</span>
      </div>
      <div className="automation-multipliers">
        <div>
          <span>Множитель автоматики</span>
          <strong>×{view.boostedAutoMultiplier.toFixed(2)}</strong>
        </div>
        <div>
          <span>Общий доход</span>
          <strong>×{view.incomeMultiplier.toFixed(2)}</strong>
        </div>
        <div>
          <span>Контур синхронизации</span>
          <strong>{view.syncLevel ? `+${view.syncBonusPercent}%` : "не открыт"}</strong>
        </div>
      </div>
      <div className="sync-explainer">
        <div className="sync-copy">
          <strong>
            {view.syncLevel
              ? `Ещё ${25 - (state.totalClicks % 25)} кликов до следующего импульса`
              : "Клики усиливают автоматизацию"}
          </strong>
          <span>
            {view.syncLevel
              ? `${view.syncLevel} ур. контура · +1% к автодоходу за уровень каждые 25 кликов`
              : "Открой «Контур синхронизации» после 3 уровней разгона процессора."}
          </span>
        </div>
        <div
          className="sync-meter"
          aria-label={`Прогресс синхронизации: ${Math.round(view.syncProgress)}%`}
        >
          <div style={{ width: `${view.syncProgress}%` }} />
        </div>
      </div>
      <a className="automation-link" href="#upgrade-tree">
        Улучшения <span aria-hidden="true">↓</span>
      </a>
    </section>
  );
}
