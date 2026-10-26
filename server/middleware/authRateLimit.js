const attempts = new Map();
const windowMs = 15 * 60 * 1000;
const maxAttempts = 10;

export function authRateLimit(request, response, next) {
  const now = Date.now();
  const key = request.ip || request.socket.remoteAddress || "unknown";
  const entry = attempts.get(key);

  if (entry && entry.expiresAt > now && entry.count >= maxAttempts) {
    response.set("Retry-After", String(Math.ceil((entry.expiresAt - now) / 1000)));
    return response.status(429).json({ error: "Слишком много попыток. Попробуйте позже." });
  }

  if (!entry || entry.expiresAt <= now) {
    attempts.set(key, { count: 1, expiresAt: now + windowMs });
  } else {
    entry.count++;
  }

  next();
}
