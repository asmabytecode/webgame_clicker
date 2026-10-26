import { format } from "../../lib/gameMath.js";

export default function GameStats({ state, view }) {
  return (
    <>
      <section className="stats primary-stats" aria-label="Основные показатели">
        <div className="stat balance-stat">
          <div className="stat-label">Баланс забега</div>
          <div className="stat-value coins">
            <span>{format(state.coins)}</span>
            <small>CR</small>
          </div>
        </div>
        <div className="stat auto-stat">
          <div className="stat-label">Автодоход · главный источник</div>
          <div className="stat-value">
            <span>{format(view.automaticIncome)}</span>
            <small>CR / сек</small>
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Ручной клик</div>
          <div className="stat-value">
            <span>{format(view.manualIncome)}</span>
            <small>CR / клик</small>
          </div>
        </div>
      </section>
      <div className="resource-strip" aria-label="Постоянные ресурсы">
        <span>
          DATA <strong>{format(state.research)}</strong>
        </span>
        <span>
          RELIC <strong>{format(state.relics)}</strong>
        </span>
        <span>
          SOUL <strong>{format(state.souls)}</strong>
        </span>
        <span>
          Возрождения <strong>{format(state.rebirths)}</strong>
        </span>
      </div>
    </>
  );
}
