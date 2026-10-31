import { lifetimeMilestones } from "@shared/game/gameData.js";
import { format } from "@/features/game/lib/gameMath.js";

export function ExpeditionMilestones({ state, onAction }) {
  const claimed = new Set(state.claimedMilestones);

  return (
    <section className="panel progression-panel">
      <div className="progression-heading">
        <div>
          <span className="eyebrow">КАМПАНИЯ · 7 ЭТАПОВ</span>
          <h2>Журнал экспедиции</h2>
        </div>
        <div className="resource-chip relic-chip">RELIC · {format(state.relics)}</div>
      </div>
      <p className="progression-help">
        Этапы считаются по общему заработку за всё время, даже после сбросов. Забирай каждую награду
        один раз — RELIC остаются навсегда.
      </p>
      <div className="milestone-track">
        {lifetimeMilestones.map((milestone, index) => {
          const complete = state.allTimeEarned >= milestone.target;
          const alreadyClaimed = claimed.has(milestone.id);

          return (
            <article
              className={`milestone-card ${complete ? "milestone-ready" : ""} ${alreadyClaimed ? "milestone-claimed" : ""}`}
              key={milestone.id}
            >
              <span className="milestone-index">{String(index + 1).padStart(2, "0")}</span>
              <h3>{milestone.title}</h3>
              <div className="milestone-target">{format(milestone.target)} накопленных CR</div>
              <div className="milestone-footer">
                <span>+{milestone.reward} RELIC</span>
                <button
                  type="button"
                  className="milestone-claim"
                  disabled={!complete || alreadyClaimed}
                  onClick={() => onAction("claimMilestone", milestone.id)}
                >
                  {alreadyClaimed ? "Архив" : complete ? "Забрать" : "Закрыт"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
