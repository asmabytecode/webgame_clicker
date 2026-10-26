import { buttonTypes } from "../../../shared/gameData.js";
import { format } from "../../lib/gameMath.js";

export default function ButtonProfiles({ state, view, onSelect }) {
  return (
    <details className="panel profile-panel">
      <summary className="profile-summary">
        <span>
          <strong>Профили кнопки</strong>
          <small>Выбор меняет силу ручного клика</small>
        </span>
        <span className="profile-current">
          {view.selectedButton.name} · {format(view.manualIncome)} CR/клик
        </span>
      </summary>
      <div className="profile-content">
        <div className="skin-list">
          {buttonTypes.map((button) => {
            const unlocked = state.unlocked.includes(button.id);
            const active = state.selected === button.id;

            return (
              <button
                key={button.id}
                className={`skin-card ${unlocked ? "unlocked" : "locked"} ${active ? "active" : ""}`}
                type="button"
                disabled={!unlocked && state.coins < button.cost}
                onClick={() => onSelect("chooseSkin", button.id)}
              >
                <span className="skin-icon">{button.emoji}</span>
                <span className="skin-info">
                  <span className="skin-name">{button.name}</span>
                  <span className="skin-desc">+{button.power} за клик</span>
                </span>
                <span className="skin-price">
                  {unlocked ? (active ? "Активна" : "Выбрать") : `${format(button.cost)} CR`}
                </span>
              </button>
            );
          })}
        </div>
        <p className="profile-note">
          Купленные профили сохраняются до престижа; более мощная кнопка ускоряет ручной доход.
        </p>
      </div>
    </details>
  );
}
