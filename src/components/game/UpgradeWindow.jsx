import { useEffect, useRef, useState } from "react";
import { relicNodes, researchNodes, soulNodes } from "../../../shared/gameData.js";
import { format } from "../../lib/gameMath.js";
import { PermanentUpgrade, SoulUpgrade } from "./UpgradeTrees.jsx";
import RunUpgrades from "./RunUpgrades.jsx";
import ButtonProfiles from "./ButtonProfiles.jsx";
import RebirthPanel from "./RebirthPanel.jsx";
import { SectorResetPanel } from "./PermanentProgressionPanels.jsx";
import { DailyContracts, ExpeditionMilestones } from "./ProgressionPanels.jsx";
import Leaderboard from "./Leaderboard.jsx";

const upgradeTabs = [
  { id: "run", icon: "⚡", label: "Забег", currency: "CR" },
  { id: "soul", icon: "🔮", label: "Души", currency: "SOUL" },
  { id: "relic", icon: "💎", label: "Реликвии", currency: "RELIC" },
  { id: "research", icon: "🧪", label: "Исследования", currency: "DATA" },
  { id: "extras", icon: "🧭", label: "Другое", currency: "МИССИИ · СБРОСЫ" },
  { id: "leaderboard", icon: "🏆", label: "Рейтинг", currency: "ИГРОКИ" },
];

export default function UpgradeWindow({ account, state, view, onAction, onClose }) {
  const [activeTab, setActiveTab] = useState("run");
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
      return (
        <div className="extras-tab-content">
          <section className="panel progression-panel extras-reset-panel">
            <div className="progression-heading">
              <div>
                <span className="eyebrow">УПРАВЛЕНИЕ АККАУНТОМ</span>
                <h2>Сброс прогресса</h2>
              </div>
              <button
                className="reset-button wipe-button"
                type="button"
                onClick={() => {
                  if (
                    window.confirm("Полностью сбросить прогресс игры этого аккаунта, включая души?")
                  ) {
                    onAction("reset");
                  }
                }}
              >
                Стереть данные
              </button>
            </div>
            <p className="offline-note">
              Полный сброс удалит баланс, улучшения и накопленные постоянные ресурсы.
            </p>
          </section>
          <ButtonProfiles state={state} view={view} onSelect={onAction} />
          <RebirthPanel state={state} view={view} onAction={onAction} />
          <SectorResetPanel state={state} view={view} onAction={onAction} />
          <DailyContracts state={state} onAction={onAction} />
          <ExpeditionMilestones state={state} onAction={onAction} />
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
            </div>
            <div className="resource-chip soul-chip">SOUL · {format(state.souls)}</div>
          </div>
          <div className="soul-tree">
            {soulNodes.map((node) => (
              <SoulUpgrade key={node.id} node={node} state={state} onBuy={onAction} />
            ))}
          </div>
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
            </div>
            <div className="resource-chip relic-chip">RELIC · {format(state.relics)}</div>
          </div>
          <div className="soul-tree">
            {relicNodes.map((node) => (
              <PermanentUpgrade
                key={node.id}
                node={node}
                state={state}
                currency="relics"
                onBuy={onAction}
              />
            ))}
          </div>
        </section>
      );
    }

    return (
      <section
        className="panel tree-panel permanent-upgrade-panel"
        aria-label="Исследования за данные"
      >
        <div className="tree-heading">
          <div>
            <span className="eyebrow">ПОСТОЯННОЕ РАЗВИТИЕ</span>
            <h2>Лаборатория</h2>
          </div>
          <div className="resource-chip data-chip">DATA · {format(state.research)}</div>
        </div>
        <div className="soul-tree">
          {researchNodes.map((node) => (
            <PermanentUpgrade
              key={node.id}
              node={node}
              state={state}
              currency="research"
              onBuy={onAction}
            />
          ))}
        </div>
        <p className="offline-note">
          Офлайн-доход ограничен 8 часами; улучшения архива увеличивают предел, но не более 24
          часов.
        </p>
      </section>
    );
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
                            : state.research,
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
