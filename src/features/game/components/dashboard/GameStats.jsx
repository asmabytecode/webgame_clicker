import { format } from "@/features/game/lib/gameMath.js";

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
        <span className="currency-relic">
          <span title="Реликвии: награда за экспедиции и кампанию; тратятся в мастерской.">
            RELIC
          </span>{" "}
          <strong>{format(state.relics)}</strong>
        </span>
        <span className="currency-soul">
          <span title="Души: награда за возрождение; тратятся на вечные улучшения.">SOUL</span>{" "}
          <strong>{format(state.souls)}</strong>
        </span>
        <span className="currency-ascension">
          <span title="Ядра: награда за вознесение; тратятся на улучшения третьего уровня престижа.">
            CORE
          </span>{" "}
          <strong>{format(state.ascensionCores)}</strong>
        </span>
        <span>
          Возрождения <strong>{format(state.rebirths)}</strong>
        </span>
        <span>
          Вознесения <strong>{format(state.ascensions)}</strong>
        </span>
      </div>
    </>
  );
}
