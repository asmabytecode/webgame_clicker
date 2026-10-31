import AuthScreen from "@/features/auth/AuthScreen.jsx";
import GameScreen from "@/features/game/components/dashboard/GameScreen.jsx";
import { useGameSession } from "@/features/game/hooks/useGameSession.js";
import { createGameViewModel } from "@/features/game/lib/gameViewModel.js";

export default function App() {
  const session = useGameSession();

  if (session.loading) {
    return (
      <main className="loading-screen">
        <div className="loading-orbit brand-mark">S0</div>
        <p>Загружаю игру...</p>
      </main>
    );
  }

  if (!session.account || !session.state) {
    return (
      <>
        <AuthScreen onAuthenticated={session.acceptAuth} />
        {session.pageError && (
          <div className="toast show" role="alert">
            {session.pageError}
          </div>
        )}
      </>
    );
  }

  return (
    <GameScreen
      account={session.account}
      state={session.state}
      view={createGameViewModel(session.state)}
      pageError={session.pageError}
      toast={session.toast}
      onAction={session.performAction}
      onLogout={session.logout}
    />
  );
}
