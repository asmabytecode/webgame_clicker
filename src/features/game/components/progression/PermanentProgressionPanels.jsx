import { ascensionNodes } from "@shared/game/gameData.js";
import { format } from "@/features/game/lib/gameMath.js";
import { PermanentUpgradeTabs } from "@/features/game/components/upgrades/UpgradeTrees.jsx";

const ascensionGroups = [
  {
    title: "Усиление дохода",
    description: "Увеличивает заработок с кликов и автоматизации.",
    nodes: ["ascensionIncome", "ascensionClick", "ascensionAuto"],
  },
  {
    title: "Подготовка забега",
    description: "Начинай с запасом CR и получай больше душ за возрождение.",
    nodes: ["ascensionStart", "ascensionSouls"],
  },
  {
    title: "Офлайн-прогресс",
    description: "Увеличивает время, за которое копится доход без игры.",
    nodes: ["ascensionOffline"],
  },
];

export function AscensionPanel({ state, view, onAction }) {
  function ascend() {
    if (
      window.confirm(
        `Вознестись и получить ${format(view.ascensionReward)} CORE? CR и улучшения забега сбросятся; остальные постоянные улучшения сохранятся.`,
      )
    ) {
      onAction("ascend");
    }
  }

  return (
    <section className="panel tree-panel permanent-upgrade-panel" aria-label="Вознесение">
      <div className="tree-heading">
        <div>
          <span className="eyebrow">ПРЕСТИЖ III · ВЫШЕ ВОЗРОЖДЕНИЯ</span>
          <h2>Вознесение</h2>
          <p>
            Новый постоянный уровень развития. Сначала соверши хотя бы одно возрождение, затем
            заработай за забег 1 000 000 CR. Награда растёт с каждым новым порогом.
          </p>
        </div>
        <div className="resource-chip ascension-chip">CORE · {format(state.ascensionCores)}</div>
      </div>
      <div className="progression-purpose">
        <div>
          <strong>
            {view.ascensionReward > 0
              ? `Можно получить: +${format(view.ascensionReward)} CORE`
              : `Следующая награда: ${format(view.ascensionThreshold)} CR за забег`}
          </strong>
          <span>
            {state.rebirths < 1
              ? "Сначала нужно хотя бы раз совершить возрождение."
              : `${format(state.totalEarned)} / ${format(view.ascensionThreshold)} CR в текущем забеге.`}
          </span>
        </div>
        <button
          className="rebirth-button ascension-button"
          type="button"
          disabled={view.ascensionReward < 1}
          onClick={ascend}
        >
          {view.ascensionReward > 0
            ? `Вознестись · +${format(view.ascensionReward)} CORE`
            : "Вознесение недоступно"}
        </button>
      </div>
      <div className="progression-purpose">
        <div>
          <strong>Что сбросится</strong>
          <span>CR, улучшения забега и открытые кнопки.</span>
        </div>
        <div>
          <strong>Что останется</strong>
          <span>SOUL, RELIC, CORE, возрождения и все постоянные древа.</span>
        </div>
      </div>
      <PermanentUpgradeTabs
        groups={ascensionGroups}
        nodes={ascensionNodes}
        state={state}
        onBuy={onAction}
        currency="ascensionCores"
      />
    </section>
  );
}

export function SectorResetPanel({ state, view, onAction }) {
  function resetSector() {
    if (
      window.confirm(
        `Сменить сектор и получить ${format(view.sectorRewardAmount)} реликвий? Кредиты и улучшения текущего забега сбросятся.`,
      )
    ) {
      onAction("sectorReset");
    }
  }

  return (
    <section className="panel progression-panel">
      <div className="progression-heading">
        <div>
          <span className="eyebrow">СБРОС II · ЭКСПЕДИЦИЯ</span>
          <h2>Смена сектора</h2>
        </div>
        <div className="resource-chip relic-chip">RELIC · {format(state.relics)}</div>
      </div>
      <div className="progression-purpose">
        <div>
          <strong>Зачем менять сектор</strong>
          <span>
            Это длинный престижный цикл: награда RELIC зависит от заработка за забег и открывает
            постоянные улучшения мастерской.
          </span>
        </div>
        <div className="progression-reset-details">
          <span>
            <strong>Сбросится:</strong> CR, улучшения забега и открытые кнопки.
          </span>
          <span>
            <strong>Останется:</strong> RELIC, SOUL, CORE, постоянные улучшения и общий прогресс.
          </span>
        </div>
      </div>
      <div className="reset-layout">
        <div className="reset-explanation">
          <strong>Следующая реликвия: {format(view.sectorThreshold)} CR за забег.</strong>
          <span>
            {view.sectorRewardAmount > 0
              ? `Можно забрать сейчас: +${format(view.sectorRewardAmount)} RELIC. Следующая награда увеличится после достижения нового порога.`
              : `Прогресс: ${format(state.totalEarned)} / ${format(view.sectorThreshold)} CR.`}
          </span>
        </div>
        <button
          className="rebirth-button sector-button"
          type="button"
          disabled={view.sectorRewardAmount < 1}
          onClick={resetSector}
        >
          {view.sectorRewardAmount > 0
            ? `Сменить сектор · +${format(view.sectorRewardAmount)} RELIC`
            : "Смена сектора недоступна"}
        </button>
      </div>
    </section>
  );
}
