import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { accrueAutoIncome, createGameState, normalizeGameState } from "../features/game/game.js";

export const dataRoot = path.resolve(process.env.GAME_DATA_DIR || "data");
export const userDataRoot = path.join(dataRoot, "users");

fs.mkdirSync(userDataRoot, { recursive: true });

export const registry = new Database(path.join(dataRoot, "accounts.sqlite"));
registry.pragma("journal_mode = WAL");
registry.pragma("foreign_keys = ON");
registry.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    username_key TEXT NOT NULL UNIQUE,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
`);
registry.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());

export function openUserDatabase(userId) {
  const databasePath = path.join(userDataRoot, userId, "game.sqlite");
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  database.pragma("journal_mode = WAL");
  database.exec(`
    CREATE TABLE IF NOT EXISTS game_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      state_json TEXT NOT NULL
    )
  `);
  const row = database.prepare("SELECT state_json FROM game_state WHERE id = 1").get();
  if (!row) {
    database
      .prepare("INSERT INTO game_state (id, state_json) VALUES (1, ?)")
      .run(JSON.stringify(createGameState()));
  }
  return database;
}

export function updateGameState(userId, update) {
  const database = openUserDatabase(userId);
  try {
    const transaction = database.transaction(() => {
      const row = database.prepare("SELECT state_json FROM game_state WHERE id = 1").get();
      const state = normalizeGameState(JSON.parse(row.state_json));
      const result = update(state);
      database
        .prepare("UPDATE game_state SET state_json = ? WHERE id = 1")
        .run(JSON.stringify(state));
      return result;
    });
    return transaction();
  } finally {
    database.close();
  }
}

export function loadAndUpdateGame(userId) {
  return updateGameState(userId, (state) => {
    accrueAutoIncome(state);
    return state;
  });
}
