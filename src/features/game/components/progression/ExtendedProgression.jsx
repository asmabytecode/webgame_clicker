import {
  achievements,
  artifacts,
  bossHealth,
  bosses,
  campaignChapters,
  sectors,
} from "@shared/game/gameData.js";
import { format } from "@/features/game/lib/gameMath.js";

export default function ExtendedProgression({ state, view, onAction, section }) {
  const boss = bosses[state.bossesDefeated % bosses.length];
  const health = bossHealth(state.bossesDefeated);
  const bossProgress = Math.min(100, (state.bossDamage / health) * 100);
  const nextSector = sectors[(state.sectorResets + 1) % sectors.length];

  return (
    <>
      {section === "expedition" && (
        <section className="panel progression-panel">
          <div className="progression-heading">
            <div>
              <span className="eyebrow">ЭКСПЕДИЦИЯ · МОДИФИКАТОРЫ</span>
              <h2>Сектора</h2>
            </div>
            <div className="resource-chip relic-chip">СМЕНЕНО · {format(state.sectorResets)}</div>
          </div>
          <p className="progression-help">
            Каждый сброс сектора меняет бонусы клика и автоматики. Выбирай сектор под свой стиль
            игры; новая специализация действует до следующей смены.
          </p>
          <div className="extended-card-grid">
            <article className="contract-card extended-card">
              <span className="contract-code">ТЕКУЩИЙ СЕКТОР</span>
              <h3>{view.sector.name}</h3>
              <p>{view.sector.description}</p>
              <span className="sector-bonus">
                Клик ×{view.sector.clickMultiplier.toFixed(2)} · Авто ×
                {view.sector.autoMultiplier.toFixed(2)}
              </span>
            </article>
            <article className="contract-card extended-card">
              <span className="contract-code">ПОСЛЕ СМЕНЫ</span>
              <h3>{nextSector.name}</h3>
              <p>{nextSector.description}</p>
              <span className="sector-bonus">Новая специализация откроется после экспедиции.</span>
            </article>
          </div>
        </section>
      )}

      {section === "expedition" && (
        <section className="panel progression-panel">
          <div className="progression-heading">
            <div>
              <span className="eyebrow">АНОМАЛИЯ · НАГРАДА: RELIC + АРТЕФАКТЫ</span>
              <h2>
                {boss.icon} {boss.name}
              </h2>
            </div>
            <div className="resource-chip data-chip">ПОБЕД · {format(state.bossesDefeated)}</div>
          </div>
          <p className="offline-note">
            Каждый заработанный CR наносит 1 урон. Победа даёт RELIC и артефакты. Здоровье следующих
            боссов растёт после каждого цикла.
          </p>
          <div className="contract-meter-label">
            <span>{state.bossDamage >= health ? "Босс побеждён" : "Прогресс боя"}</span>
            <span>
              {format(state.bossDamage)} / {format(health)}
            </span>
          </div>
          <div className="progress-track boss-meter">
            <div className="progress-fill" style={{ width: `${bossProgress}%` }} />
          </div>
          <button
            className="small-action"
            type="button"
            disabled={state.bossDamage < health}
            onClick={() => onAction("claimBoss")}
          >
            {state.bossDamage >= health ? "Забрать награду" : "Продолжай зарабатывать CR"}
          </button>
        </section>
      )}

      {section === "expedition" && (
        <section className="panel progression-panel">
          <div className="progression-heading">
            <div>
              <span className="eyebrow">ТРОФЕИ БОССОВ · АКТИВЕН ОДИН</span>
              <h2>Артефакты</h2>
            </div>
            <div className="resource-chip relic-chip">
              НАЙДЕНО · {state.ownedArtifacts.length}/{artifacts.length}
            </div>
          </div>
          <p className="progression-help">
            Артефакты выпадают за первые победы над боссами. Экипируй один: его бонус действует на
            текущие и следующие забеги.
          </p>
          <div className="extended-card-grid">
            {artifacts.map((artifact) => {
              const owned = state.ownedArtifacts.includes(artifact.id);
              const active = state.activeArtifact === artifact.id;
              return (
                <article
                  className={`contract-card artifact-card ${active ? "contract-complete" : ""}`}
                  key={artifact.id}
                >
                  <span className="artifact-icon" aria-hidden="true">
                    {artifact.icon}
                  </span>
                  <h3>{artifact.name}</h3>
                  <p>
                    {owned
                      ? artifact.description
                      : "Победи соответствующего босса, чтобы найти этот артефакт."}
                  </p>
                  <button
                    className="small-action"
                    type="button"
                    disabled={!owned || active}
                    onClick={() => onAction("equipArtifact", artifact.id)}
                  >
                    {!owned ? "Не найден" : active ? "Активен" : "Экипировать"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {section === "campaign" && (
        <section className="panel progression-panel">
          <div className="progression-heading">
            <div>
              <span className="eyebrow">ПОСТОЯННЫЕ НАГРАДЫ · RELIC</span>
              <h2>Достижения</h2>
            </div>
            <div className="resource-chip relic-chip">RELIC · {format(state.relics)}</div>
          </div>
          <p className="progression-help">
            Достижения отслеживают разные стили игры. После выполнения забери RELIC — награда
            сохраняется навсегда.
          </p>
          <div className="extended-card-grid">
            {achievements.map((achievement) => {
              const complete = state[achievement.stat] >= achievement.target;
              const claimed = state.claimedAchievements.includes(achievement.id);
              return (
                <article
                  className={`contract-card ${complete ? "contract-complete" : ""}`}
                  key={achievement.id}
                >
                  <h3>{achievement.title}</h3>
                  <p>{achievement.description}</p>
                  <div className="contract-meter-label">
                    <span>
                      {format(Math.min(state[achievement.stat], achievement.target))} /{" "}
                      {format(achievement.target)}
                    </span>
                    <span>+{achievement.reward} RELIC</span>
                  </div>
                  <button
                    className="small-action"
                    type="button"
                    disabled={!complete || claimed}
                    onClick={() => onAction("claimAchievement", achievement.id)}
                  >
                    {claimed ? "Получено" : complete ? "Забрать награду" : "Закрыто"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {section === "campaign" && (
        <section className="panel progression-panel">
          <div className="progression-heading">
            <div>
              <span className="eyebrow">ЭНДГЕЙМ · ПОСЛЕ 2M CR</span>
              <h2>Новые главы кампании</h2>
            </div>
            <div className="resource-chip relic-chip">Всего · {format(state.allTimeEarned)} CR</div>
          </div>
          <p className="progression-help">
            Главы продолжают кампанию после первых 2 млн CR. Цель считается по заработку за всё
            время, а не только за текущий забег.
          </p>
          <div className="extended-card-grid">
            {campaignChapters.map((chapter) => {
              const complete = state.allTimeEarned >= chapter.target;
              const claimed = state.claimedChapters.includes(chapter.id);
              return (
                <article
                  className={`contract-card ${complete ? "contract-complete" : ""}`}
                  key={chapter.id}
                >
                  <h3>{chapter.title}</h3>
                  <p>{chapter.description}</p>
                  <div className="contract-meter-label">
                    <span>
                      {format(Math.min(state.allTimeEarned, chapter.target))} /{" "}
                      {format(chapter.target)}
                    </span>
                    <span>+{chapter.reward} RELIC</span>
                  </div>
                  <button
                    className="small-action"
                    type="button"
                    disabled={!complete || claimed}
                    onClick={() => onAction("claimChapter", chapter.id)}
                  >
                    {claimed ? "Пройдено" : complete ? "Забрать награду" : "В процессе"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
