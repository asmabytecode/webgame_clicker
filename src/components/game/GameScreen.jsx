import { DailyContracts, ExpeditionMilestones } from "../ProgressionPanels.jsx";
import GameHeader from "./GameHeader.jsx";
import GameStats from "./GameStats.jsx";
import AutomationPanel from "./AutomationPanel.jsx";
import ClickPanel from "./ClickPanel.jsx";
import ButtonProfiles from "./ButtonProfiles.jsx";
import RunUpgrades from "./RunUpgrades.jsx";
import RebirthPanel from "./RebirthPanel.jsx";
import { ResearchPanel, SectorResetPanel } from "./PermanentProgressionPanels.jsx";
import Leaderboard from "./Leaderboard.jsx";

export default function GameScreen({ account, state, view, pageError, toast, onAction, onLogout }) {
  return (
    <main className="app">
      <GameHeader account={account} onLogout={onLogout} onReset={() => onAction("reset")} />
      <GameStats state={state} view={view} />
      <Leaderboard account={account} />

      {pageError && (
        <div className="page-error" role="alert">
          {pageError}
        </div>
      )}

      <div className="main-grid">
        <AutomationPanel state={state} view={view} />
        <ClickPanel state={state} view={view} onClick={() => onAction("click")} />
      </div>
      <ButtonProfiles state={state} view={view} onSelect={onAction} />
      <DailyContracts state={state} onAction={onAction} />
      <RunUpgrades state={state} onBuy={onAction} />
      <ExpeditionMilestones state={state} onAction={onAction} />
      <RebirthPanel state={state} view={view} onAction={onAction} />
      <SectorResetPanel state={state} view={view} onAction={onAction} />
      <ResearchPanel state={state} onAction={onAction} />

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </main>
  );
}
