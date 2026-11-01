import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import authRoutes from "./features/auth/authRoutes.js";
import gameRoutes from "./features/game/gameRoutes.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.resolve(currentDirectory, "..", "dist");
const requestBodyLimit = "10kb";

function setSecurityHeaders(request, response, next) {
  response.set("X-Content-Type-Options", "nosniff");
  response.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.set("X-Frame-Options", "DENY");
  next();
}

function configureMiddleware(app) {
  app.disable("x-powered-by");
  app.use(express.json({ limit: requestBodyLimit }));
  app.use(setSecurityHeaders);
}

function configureApiRoutes(app) {
  app.get("/api/health", (request, response) =>
    response.json({
      status: "ok",
      service: "sector-zero-api",
      uptimeSeconds: Math.floor(process.uptime()),
      checkedAt: new Date().toISOString(),
    }),
  );
  app.use("/api/auth", authRoutes);
  app.use("/api/game", gameRoutes);
}

function configureClientRoutes(app) {
  if (!fs.existsSync(distDirectory)) return;

  app.use(express.static(distDirectory));
  app.get("*path", (request, response) =>
    response.sendFile(path.join(distDirectory, "index.html")),
  );
}

function handleErrors(error, request, response, next) {
  console.error("Ошибка API:", error);
  if (response.headersSent) return next(error);

  response.status(error.status || 500).json({
    error: error.status ? error.message : "Внутренняя ошибка сервера. Попробуйте ещё раз.",
  });
}

export function createApp() {
  const app = express();

  configureMiddleware(app);
  configureApiRoutes(app);
  configureClientRoutes(app);
  app.use(handleErrors);
  return app;
}
