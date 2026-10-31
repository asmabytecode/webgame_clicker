import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { after } from "node:test";
import Database from "better-sqlite3";
import { createGameState } from "../../game/game.js";

const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "sector-zero-leaderboard-"));
process.env.GAME_DATA_DIR = dataDirectory;

const [{ registry, userDataRoot }, { getLeaderboard }] = await Promise.all([
  import("../../../infrastructure/database.js"),
  import("../leaderboardService.js"),
]);

after(() => {
  registry.close();
  fs.rmSync(dataDirectory, { recursive: true, force: true });
  delete process.env.GAME_DATA_DIR;
});

function addPlayer(id, username, stats) {
  registry
    .prepare(
      `INSERT INTO users (id, username, username_key, password_salt, password_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(id, username, username.toLocaleLowerCase("ru-RU"), "salt", "hash", Date.now());
  const databasePath = path.join(userDataRoot, id, "game.sqlite");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  try {
    database.exec(`
      CREATE TABLE game_state (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        state_json TEXT NOT NULL
      )
    `);
    database
      .prepare("INSERT INTO game_state (id, state_json) VALUES (1, ?)")
      .run(JSON.stringify({ ...createGameState(), ...stats }));
  } finally {
    database.close();
  }
}

test("leaderboards rank players by category and return the current player's rank", () => {
  addPlayer("leader", "Архив", {
    allTimeEarned: 80,
    totalClicks: 3,
    rebirths: 1,
    sectorResets: 2,
  });
  addPlayer("north", "Север", {
    allTimeEarned: 40,
    totalClicks: 5,
    rebirths: 2,
    sectorResets: 1,
  });
  addPlayer("current", "Игрок", {
    allTimeEarned: 40,
    totalClicks: 9,
    rebirths: 3,
    sectorResets: 0,
  });

  const earned = getLeaderboard("earned", "current");
  assert.equal(earned.entries[0].username, "Архив");
  assert.equal(earned.currentPlayer.rank, 2);
  assert.equal(earned.totalPlayers, 3);

  const clicks = getLeaderboard("clicks", "current");
  assert.equal(clicks.entries[0].username, "Игрок");
  assert.equal(clicks.currentPlayer.value, 9);

  const expeditions = getLeaderboard("expeditions", "current");
  assert.equal(expeditions.entries[0].username, "Архив");
  assert.equal(expeditions.currentPlayer.rank, 3);
});

test("leaderboard rejects unknown categories", () => {
  assert.throws(() => getLeaderboard("unknown", "current"), { status: 400 });
});
