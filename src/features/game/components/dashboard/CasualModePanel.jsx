import { format } from "@/features/game/lib/gameMath.js";

export default function CasualModePanel({ state, onAction }) {
  const enabled = state.casualMode;

  return (
    <section className={`casual-mode-panel ${enabled ? "is-active" : ""}`}>
      <div className="casual-mode-copy">
        <span className="eyebrow">ПОМОЩНИК ПРОГРЕССА</span>
        <h2>{enabled ? "Казуальный режим включён" : "Казуальный режим"}</h2>
        <p>
          Автопилот выбирает выгодные улучшения, забирает награды и сравнивает престижи. Он
          работает, пока игра открыта; после возвращения учитывает офлайн-доход и снова принимает
          решение.
        </p>
        <div className="casual-mode-status" role="status" aria-live="polite">
          <strong>План:</strong> {state.casualStatus || "Анализирую прогресс..."}
        </div>
        {enabled && (
          <small className="casual-mode-note">
            Решение учитывает ожидаемый автодоход после каждого вида сброса.
          </small>
        )}
      </div>
      <button
        className="casual-mode-toggle"
        type="button"
        aria-pressed={enabled}
        onClick={() => onAction("setCasualMode", null, { enabled: !enabled })}
      >
        {enabled ? "Выключить автопилот" : "Играть автоматически"}
        <span aria-hidden="true">{enabled ? "Ⅱ" : "▶"}</span>
      </button>
      <div className="casual-mode-resources" aria-label="Ресурсы автопилота">
        <span>
          SOUL <strong>{format(state.souls)}</strong>
        </span>
        <span>
          RELIC <strong>{format(state.relics)}</strong>
        </span>
        <span>
          CORE <strong>{format(state.ascensionCores)}</strong>
        </span>
      </div>
    </section>
  );
}
