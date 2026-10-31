import { findSession, removeExpiredSessions, sessionLifetimeMs } from "./authService.js";

export const cookieName = "knopka_session";
const production = process.env.NODE_ENV === "production";

export function readCookie(request, name) {
  const cookies = request.headers.cookie || "";
  const prefix = `${name}=`;
  const value = cookies
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
}

export function setSessionCookie(response, token) {
  const secure = production ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${cookieName}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sessionLifetimeMs / 1000}${secure}`,
  );
}

export function clearSessionCookie(response) {
  const secure = production ? "; Secure" : "";
  response.setHeader(
    "Set-Cookie",
    `${cookieName}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`,
  );
}

export function requireAuth(request, response, next) {
  const token = readCookie(request, cookieName);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    return response.status(401).json({ error: "Войдите в аккаунт" });
  }

  const session = findSession(token);
  if (!session || session.expires_at <= Date.now()) {
    if (session) removeExpiredSessions();
    clearSessionCookie(response);
    return response.status(401).json({ error: "Сессия истекла. Войдите снова." });
  }

  request.user = { id: session.id, username: session.username };
  next();
}
