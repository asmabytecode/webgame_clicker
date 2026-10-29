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
        </div>
        <div className="soul-badge">SOUL · {format(state.souls)}</div>
      </div>
      <div className="rebirth-info">
        <div className="rebirth-copy">
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
    </section>
  );
}
