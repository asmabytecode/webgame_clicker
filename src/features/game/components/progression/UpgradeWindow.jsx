import { useEffect, useRef, useState } from "react";
import { relicNodes, soulNodes } from "@shared/game/gameData.js";
import { format } from "@/features/game/lib/gameMath.js";
import ButtonProfiles from "@/features/game/components/progression/ButtonProfiles.jsx";
import ExtendedProgression from "@/features/game/components/progression/ExtendedProgression.jsx";
import {
  AscensionPanel,
  SectorResetPanel,
} from "@/features/game/components/progression/PermanentProgressionPanels.jsx";
import { ExpeditionMilestones } from "@/features/game/components/progression/ProgressionPanels.jsx";
import RebirthPanel from "@/features/game/components/progression/RebirthPanel.jsx";
import RunUpgrades from "@/features/game/components/upgrades/RunUpgrades.jsx";
import { PermanentUpgradeTabs } from "@/features/game/components/upgrades/UpgradeTrees.jsx";
import Leaderboard from "@/features/leaderboard/Leaderboard.jsx";

const upgradeTabs = [
  { id: "run", icon: "⚡", label: "Забег", currency: "CR" },
  { id: "soul", icon: "🔮", label: "Души", currency: "SOUL" },
  { id: "relic", icon: "💎", label: "Реликвии", currency: "RELIC" },
  { id: "ascension", icon: "🌟", label: "Вознесение", currency: "CORE" },
  { id: "extras", icon: "🧭", label: "Другое", currency: "ПРОГРЕСС И ПРОЧЕЕ" },
  { id: "leaderboard", icon: "🏆", label: "Рейтинг", currency: "ИГРОКИ" },
];

const extrasTabs = [
  {
    id: "prestige",
    icon: "🔄",
    label: "Престиж",
    description: "Выбирай момент сброса и постоянную награду.",
  },
  {
    id: "expedition",
    icon: "🪐",
    label: "Экспедиция",
    description: "Сектора меняют бонусы; победы над боссами дают артефакты.",
  },
  {
    id: "campaign",
    icon: "🏅",
    label: "Кампания",
    description: "Долгосрочные этапы и достижения за общий прогресс.",
  },
  {
    id: "profile",
    icon: "⚙️",
    label: "Профиль",
    description: "Косметические кнопки и полный сброс сохранения.",
  },
];

const permanentUpgradeGroups = {
  soul: [
    {
      title: "Клик и автоматизация",
      description: "Постоянно усиливают оба способа заработка.",
      nodes: ["soulClick", "soulBot"],
    },
    {
      title: "Общий доход",
      description: "Увеличивает награду от всех источников.",
      nodes: ["soulFortune"],
    },
    {
      title: "Старт забега",
      description: "Даёт начальный запас CR после престижа.",
      nodes: ["soulStart"],
    },
  ],
  relic: [
    {
      title: "Мощь и престиж",
      description: "Усиливает общий доход и награду возрождения.",
      nodes: ["relicIncome", "relicSouls"],
    },
    {
      title: "Подготовка экспедиции",
      description: "Стартовые CR и больший запас офлайн-дохода.",
      nodes: ["relicStart", "relicArchive"],
    },
  ],
};

export default function UpgradeWindow({ account, state, view, onAction, onClose }) {
  const [activeTab, setActiveTab] = useState("run");
  const [activeExtrasTab, setActiveExtrasTab] = useState("prestige");
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.showModal();
    return () => dialogRef.current?.close();
  }, []);

  function renderUpgrades() {
    if (activeTab === "leaderboard") {
      return <Leaderboard account={account} />;
    }

    if (activeTab === "extras") {
      const selectedExtrasTab =
        extrasTabs.find((tab) => tab.id === activeExtrasTab) || extrasTabs[0];
      return (
        <div className="extras-tab-content">
          <div className="extras-section-heading">
            <div>
              <span className="eyebrow">ПРОГРЕСС И ЦЕЛИ</span>
              <h2>{selectedExtrasTab.label}</h2>
              <p>{selectedExtrasTab.description}</p>
            </div>
          </div>
          <div className="extras-subtabs" role="tablist" aria-label="Разделы прогресса">
            {extrasTabs.map((tab) => {
              const selected = tab.id === activeExtrasTab;
              return (
                <button
                  className={`extras-subtab ${selected ? "active" : ""}`}
                  id={`extras-tab-${tab.id}`}
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="extras-panel"
                  onClick={() => setActiveExtrasTab(tab.id)}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  <strong>{tab.label}</strong>
                </button>
              );
            })}
          </div>
          <div
            className="extras-subtab-panel"
            id="extras-panel"
            role="tabpanel"
            aria-labelledby={`extras-tab-${activeExtrasTab}`}
          >
            {activeExtrasTab === "prestige" && (
              <>
                <RebirthPanel state={state} view={view} onAction={onAction} />
                <SectorResetPanel state={state} view={view} onAction={onAction} />
              </>
            )}
            {activeExtrasTab === "expedition" && (
              <ExtendedProgression
                state={state}
                view={view}
                onAction={onAction}
                section="expedition"
              />
            )}
            {activeExtrasTab === "campaign" && (
              <>
                <ExpeditionMilestones state={state} onAction={onAction} />
                <ExtendedProgression
                  state={state}
                  view={view}
                  onAction={onAction}
                  section="campaign"
                />
              </>
            )}
            {activeExtrasTab === "profile" && (
              <>
                <ButtonProfiles state={state} view={view} onSelect={onAction} />
                <section className="panel progression-panel extras-reset-panel">
                  <div className="progression-heading">
                    <div>
                      <span className="eyebrow">УПРАВЛЕНИЕ АККАУНТОМ</span>
                      <h2>Полный сброс</h2>
                    </div>
                    <button
                      className="reset-button wipe-button"
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Полностью сбросить прогресс игры этого аккаунта, включая души?",
                          )
                        ) {
                          onAction("reset");
                        }
                      }}
                    >
                      Стереть данные
                    </button>
                  </div>
                  <p className="offline-note">
                    Удалит весь прогресс: CR, улучшения, SOUL, RELIC, CORE, экспедиции и достижения.
                    Это действие нельзя отменить.
                  </p>
                </section>
              </>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === "run") {
      return <RunUpgrades state={state} onBuy={onAction} />;
    }

    if (activeTab === "soul") {
      return (
        <section
          className="panel tree-panel permanent-upgrade-panel"
          aria-label="Вечные улучшения за души"
        >
          <div className="tree-heading">
            <div>
              <span className="eyebrow">ПОСТОЯННОЕ РАЗВИТИЕ</span>
              <h2>Вечные улучшения</h2>
              <p>
                Получай SOUL за возрождение от 10 000 CR за забег. Вкладывай его в постоянные
                бонусы, которые переживают сброс.
              </p>
            </div>
            <div className="resource-chip soul-chip">SOUL · {format(state.souls)}</div>
          </div>
          <PermanentUpgradeTabs
            groups={permanentUpgradeGroups.soul}
            nodes={soulNodes}
            state={state}
            onBuy={onAction}
            currency="souls"
          />
        </section>
      );
    }

    if (activeTab === "relic") {
      return (
        <section
          className="panel tree-panel permanent-upgrade-panel"
          aria-label="Улучшения за реликвии"
        >
          <div className="tree-heading">
            <div>
              <span className="eyebrow">ПОСТОЯННОЕ РАЗВИТИЕ</span>
              <h2>Артефактная мастерская</h2>
              <p>
                Получай RELIC за смену сектора и этапы кампании. Улучшения мастерской сохраняются
                после любого престижа.
              </p>
            </div>
            <div className="resource-chip relic-chip">RELIC · {format(state.relics)}</div>
          </div>
          <PermanentUpgradeTabs
            groups={permanentUpgradeGroups.relic}
            nodes={relicNodes}
            state={state}
            onBuy={onAction}
            currency="relics"
          />
        </section>
      );
    }

    return <AscensionPanel state={state} view={view} onAction={onAction} />;
  }

  return (
    <dialog
      className="upgrade-dialog"
      ref={dialogRef}
      aria-labelledby="upgrade-dialog-title"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          event.currentTarget.close();
        }
      }}
    >
      <div className="upgrade-dialog-shell">
        <header className="upgrade-dialog-header">
          <div>
            <span className="eyebrow">ВЫБИРАЙ СВОЙ ПУТЬ</span>
            <h2 id="upgrade-dialog-title">Древо улучшений</h2>
            <p>Усиливай клик, автоматизацию и постоянные бонусы.</p>
          </div>
          <button
            className="upgrade-dialog-close"
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Закрыть окно улучшений"
          >
            ×
          </button>
        </header>
        <div className="upgrade-tabs" role="tablist" aria-label="Разделы игры">
          {upgradeTabs.map((tab) => (
            <button
              key={tab.id}
              id={`upgrade-tab-${tab.id}`}
              className={`upgrade-tab ${activeTab === tab.id ? "active" : ""}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls="upgrade-tab-panel"
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="upgrade-tab-icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span>{tab.label}</span>
              <small>
                {tab.id === "extras" || tab.id === "leaderboard"
                  ? tab.currency
                  : `${format(
                      tab.id === "run"
                        ? state.coins
                        : tab.id === "soul"
                          ? state.souls
                          : tab.id === "relic"
                            ? state.relics
                            : state.ascensionCores,
                    )} ${tab.currency}`}
              </small>
            </button>
          ))}
        </div>
        <div
          className="upgrade-tab-panel"
          id="upgrade-tab-panel"
          role="tabpanel"
          aria-labelledby={`upgrade-tab-${activeTab}`}
        >
          {renderUpgrades()}
        </div>
      </div>
    </dialog>
  );
}
