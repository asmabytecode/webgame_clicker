import Database from "better-sqlite3";
import path from "node:path";
import { leaderboardCategories } from "../../../shared/leaderboard/leaderboardData.js";
import { normalizeGameState } from "../game/game.js";
import { registry, userDataRoot } from "../../infrastructure/database.js";

const leaderboardLimit = 10;

export function getLeaderboard(categoryId, currentUserId) {
  const category = leaderboardCategories.find((item) => item.id === categoryId);
  if (!category) throw Object.assign(new Error("Категория рейтинга не найдена"), { status: 400 });

  const users = registry.prepare("SELECT id, username FROM users").all();
  const players = users.map((user) => {
    const database = new Database(path.join(userDataRoot, user.id, "game.sqlite"), {
      readonly: true,
      fileMustExist: true,
    });
    try {
      const row = database.prepare("SELECT state_json FROM game_state WHERE id = 1").get();
      if (!row) throw new Error(`Игровое сохранение не найдено для аккаунта ${user.id}`);
      const state = normalizeGameState(JSON.parse(row.state_json));
      return { id: user.id, username: user.username, value: state[category.stat] };
    } finally {
      database.close();
    }
  });

  players.sort((left, right) => {
    if (right.value !== left.value) return right.value - left.value;
    return left.username.localeCompare(right.username, "ru");
  });

  const currentRank = players.findIndex((player) => player.id === currentUserId);
  return {
    category: category.id,
    entries: players.slice(0, leaderboardLimit).map(({ username, value }, index) => ({
      rank: index + 1,
      username,
      value,
    })),
    currentPlayer:
      currentRank < 0 ? null : { rank: currentRank + 1, value: players[currentRank].value },
    totalPlayers: players.length,
  };
}
