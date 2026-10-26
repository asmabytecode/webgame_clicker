import crypto from "node:crypto";
import { promisify } from "node:util";
import { loadAndUpdateGame, registry } from "../database.js";

const scrypt = promisify(crypto.scrypt);
export const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;

function createError(message, status) {
  return Object.assign(new Error(message), { status });
}

function tokenDigest(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function issueSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  registry
    .prepare("INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)")
    .run(tokenDigest(token), userId, Date.now() + sessionLifetimeMs);
  return token;
}

export async function registerUser(usernameInput, password) {
  const username = typeof usernameInput === "string" ? usernameInput.trim() : "";
  if (!/^[\p{L}\p{N}_-]{3,20}$/u.test(username)) {
    throw createError("Ник: от 3 до 20 букв, цифр, «_» или «-».", 400);
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    throw createError("Пароль должен содержать от 8 до 128 символов.", 400);
  }

  const salt = crypto.randomBytes(16);
  const passwordHash = await scrypt(password, salt, 64);
  const userId = crypto.randomUUID();
  try {
    registry
      .prepare(
        `
        INSERT INTO users (id, username, username_key, password_salt, password_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      )
      .run(
        userId,
        username,
        username.toLocaleLowerCase("ru-RU"),
        salt.toString("hex"),
        passwordHash.toString("hex"),
        Date.now(),
      );
  } catch (error) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") throw createError("Этот ник уже занят.", 409);
    throw error;
  }

  const token = issueSession(userId);
  return { token, user: { username }, state: loadAndUpdateGame(userId) };
}

export async function loginUser(usernameInput, password) {
  const username = typeof usernameInput === "string" ? usernameInput.trim() : "";
  const safePassword = typeof password === "string" ? password : "";
  const user = registry
    .prepare("SELECT id, username, password_salt, password_hash FROM users WHERE username_key = ?")
    .get(username.toLocaleLowerCase("ru-RU"));

  if (!user || safePassword.length > 128) {
    throw createError("Неверный ник или пароль.", 401);
  }

  const hash = await scrypt(safePassword, Buffer.from(user.password_salt, "hex"), 64);
  if (!crypto.timingSafeEqual(hash, Buffer.from(user.password_hash, "hex"))) {
    throw createError("Неверный ник или пароль.", 401);
  }

  const token = issueSession(user.id);
  return {
    token,
    user: { username: user.username },
    state: loadAndUpdateGame(user.id),
  };
}

export function findSession(token) {
  return registry
    .prepare(
      `
      SELECT users.id, users.username, sessions.expires_at
      FROM sessions JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = ?
    `,
    )
    .get(tokenDigest(token));
}

export function removeSession(token) {
  registry.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenDigest(token));
}

export function removeExpiredSessions(now = Date.now()) {
  registry.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
}
