import { useEffect, useState } from "react";
import { leaderboardCategories } from "../../../shared/leaderboardData.js";
import { api } from "../../lib/api.js";
import { format } from "../../lib/gameMath.js";

export default function Leaderboard({ account }) {
  const [categoryId, setCategoryId] = useState(leaderboardCategories[0].id);
  const [refreshNumber, setRefreshNumber] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const category = leaderboardCategories.find((item) => item.id === categoryId);
  const currentResult = result?.category === categoryId ? result : null;

  useEffect(() => {
    let active = true;
    let requestInProgress = false;
    setLoading(true);
    setError("");

    const loadLeaderboard = async () => {
      if (requestInProgress) return;
      requestInProgress = true;
      try {
        const data = await api(`/api/game/leaderboard?category=${categoryId}`);
        if (active) setResult(data);
      } catch (requestError) {
        if (active) setError(requestError.message);
      } finally {
        requestInProgress = false;
        if (active) setLoading(false);
      }
    };

    loadLeaderboard();
    const timer = window.setInterval(loadLeaderboard, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [categoryId, refreshNumber]);

  return (
    <section className="panel section-panel leaderboard-panel" aria-labelledby="leaderboard-title">
      <div className="section-heading leaderboard-heading">
        <div>
          <h2 id="leaderboard-title">Таблица лидеров</h2>
          <span>
            {currentResult ? `Игроков: ${currentResult.totalPlayers}` : "Рейтинг игроков"}
          </span>
        </div>
        <button
          className="leaderboard-refresh"
          type="button"
          onClick={() => setRefreshNumber((number) => number + 1)}
          disabled={loading}
        >
          Обновить
        </button>
      </div>

      <div className="leaderboard-categories" aria-label="Категории рейтинга">
        {leaderboardCategories.map((item) => (
          <button
            key={item.id}
            className={categoryId === item.id ? "active" : ""}
            type="button"
            aria-pressed={categoryId === item.id}
            onClick={() => setCategoryId(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="leaderboard-message" role="alert">
          {error}
        </p>
      ) : loading && !currentResult ? (
        <p className="leaderboard-message" role="status">
          Загружаю рейтинг...
        </p>
      ) : currentResult?.entries.length ? (
        <>
          <div className="leaderboard-table-wrap">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th scope="col">Место</th>
                  <th scope="col">Игрок</th>
                  <th scope="col">{category.label}</th>
                </tr>
              </thead>
              <tbody>
                {currentResult.entries.map((entry) => (
                  <tr
                    key={entry.username}
                    className={entry.username === account.username ? "current-player" : ""}
                  >
                    <td>#{entry.rank}</td>
                    <td>
                      {entry.username}
                      {entry.username === account.username && (
                        <span className="leaderboard-you">Вы</span>
                      )}
                    </td>
                    <td>
                      {format(entry.value)} <small>{category.unit}</small>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {currentResult.currentPlayer &&
            currentResult.currentPlayer.rank > currentResult.entries.length && (
              <p className="leaderboard-your-rank" role="status">
                Ваше место: <strong>#{currentResult.currentPlayer.rank}</strong> ·{" "}
                {format(currentResult.currentPlayer.value)} {category.unit}
              </p>
            )}
        </>
      ) : (
        <p className="leaderboard-message">Пока нет игроков в рейтинге.</p>
      )}
    </section>
  );
}
