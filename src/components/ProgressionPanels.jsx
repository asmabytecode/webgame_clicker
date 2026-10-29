import { dailyContracts, lifetimeMilestones } from "../../shared/gameData.js";
import { format } from "../lib/gameMath.js";

export function DailyContracts({ state, onAction }) {
  const bonus = state.researchTree.researchContract || 0;
  const multiplier = 1 + bonus * 0.15;

  return (
    <section className="panel progression-panel">
      <div className="progression-heading">
        <div>
          <span className="eyebrow">ЦИКЛ · UTC</span>
          <h2>Контракты дня</h2>
        </div>
        <div className="resource-chip data-chip">DATA · {format(state.research)}</div>
      </div>
      <div className="contract-grid">
        {dailyContracts.map((contract) => {
          const progress = state.daily.progress[contract.id] || 0;
          const claimed = state.daily.claimed.includes(contract.id);
          const complete = progress >= contract.target;
          const percent = Math.min(100, (progress / contract.target) * 100);
          const researchReward = Math.floor(contract.rewardData * multiplier);
          const coinReward = Math.floor(contract.rewardCoins * multiplier);

          return (
            <article
              className={`contract-card ${complete ? "contract-complete" : ""}`}
              key={contract.id}
            >
              <div className="contract-topline">
                <span className="contract-code">{contract.icon}</span>
                <span className="contract-reward">
                  DATA {format(researchReward)} · CR {format(coinReward)}
                </span>
              </div>
              <h3>{contract.title}</h3>
              <p>{contract.description}</p>
              <div className="contract-meter-label">
                <span>{complete ? "Цель выполнена" : "Прогресс"}</span>
                <span>
                  {format(progress)} / {format(contract.target)}
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${percent}%` }} />
              </div>
              <button
                className="small-action"
                type="button"
                disabled={!complete || claimed}
                onClick={() => onAction("claimContract", contract.id)}
              >
                {claimed ? "Получено" : complete ? "Забрать награду" : "В процессе"}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

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
