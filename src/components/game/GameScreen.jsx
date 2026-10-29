import { useState } from "react";
import GameHeader from "./GameHeader.jsx";
import GameStats from "./GameStats.jsx";
import AutomationPanel from "./AutomationPanel.jsx";
import ClickPanel from "./ClickPanel.jsx";
import UpgradeWindow from "./UpgradeWindow.jsx";

export default function GameScreen({ account, state, view, pageError, toast, onAction, onLogout }) {
  const [upgradeWindowOpen, setUpgradeWindowOpen] = useState(false);

  return (
    <main className="app">
      <GameHeader account={account} onLogout={onLogout} />
      <GameStats state={state} view={view} />
      <button
        className="upgrade-launcher"
        type="button"
        onClick={() => setUpgradeWindowOpen(true)}
        aria-haspopup="dialog"
      >
        <span className="upgrade-launcher-icon" aria-hidden="true">
          🌱
        </span>
        <span className="upgrade-launcher-copy">
          <strong>Древо улучшений</strong>
          <small>Прокачка, миссии, престиж и сбросы в одном месте</small>
        </span>
        <span className="upgrade-launcher-action">
          Открыть <span aria-hidden="true">→</span>
        </span>
      </button>
      {pageError && (
        <div className="page-error" role="alert">
          {pageError}
        </div>
      )}

      <div className="main-grid">
        <AutomationPanel
          state={state}
          view={view}
          onOpenUpgrades={() => setUpgradeWindowOpen(true)}
        />
        <ClickPanel state={state} view={view} onClick={() => onAction("click")} />
      </div>
      {upgradeWindowOpen && (
        <UpgradeWindow
          account={account}
          state={state}
          view={view}
          onAction={onAction}
          onClose={() => setUpgradeWindowOpen(false)}
        />
      )}

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </main>
  );
}
