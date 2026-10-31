import { format } from "@/features/game/lib/gameMath.js";

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
            ? `Сейчас ты получишь ${format(view.soulsToEarn)} SOUL за ${format(state.totalEarned)} CR, заработанных в этом забеге.`
            : `Нужно заработать ${format(view.soulThreshold)} CR за забег. Сейчас: ${format(state.totalEarned)} CR.`}
          <div className="rebirth-progress">
            <div
              style={{
                width: `${Math.min(100, (state.totalEarned / view.soulThreshold) * 100)}%`,
              }}
            />
          </div>
          <div className="progression-purpose">
            <div>
              <strong>Зачем возрождаться</strong>
              <span>
                SOUL покупают постоянные улучшения клика, автоматики, дохода и стартового капитала.
              </span>
            </div>
            <div className="progression-reset-details">
              <span>
                <strong>Сбросится:</strong> CR, улучшения забега и открытые кнопки.
              </span>
              <span>
                <strong>Останется:</strong> SOUL, RELIC, CORE, постоянные улучшения и общий
                прогресс.
              </span>
            </div>
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
