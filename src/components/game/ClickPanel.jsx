import { format } from "../../lib/gameMath.js";

export default function ClickPanel({ state, view, onClick }) {
  return (
    <section className="panel play-panel" aria-label="Ручной клик">
      <div className="level-pill">ЗАБЕГ · УРОВЕНЬ {view.runLevel.level}</div>
      <div className="button-stage">
        <div className="button-glow" style={{ "--button-glow": view.selectedButton.glow }} />
        <button
          className="click-button"
          type="button"
          aria-label="Нажми, чтобы заработать монеты"
          onClick={onClick}
          style={{
            "--button-light": view.selectedButton.light,
            "--button-color": view.selectedButton.color,
            "--button-dark": view.selectedButton.dark,
            "--button-shadow": view.selectedButton.shadow,
          }}
        >
          <span className="button-face">
            <span className="button-emoji">
              {view.selectedButton.name.slice(0, 2).toUpperCase()}
            </span>
            <span className="button-word">{view.selectedButton.word}</span>
          </span>
        </button>
      </div>
      <div className="click-hint">+{format(view.manualIncome)} CR / клик</div>
      <div className="progress-wrap">
        <div className="progress-label">
          <span>До уровня {view.runLevel.level + 1}</span>
          <span>
            {format(state.totalEarned - view.runLevel.currentStart)} /{" "}
            {format(view.runLevel.nextStart - view.runLevel.currentStart)} CR
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${view.runLevel.progress}%` }} />
        </div>
      </div>
    </section>
  );
}
