import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import authRoutes from "./routes/authRoutes.js";
import gameRoutes from "./routes/gameRoutes.js";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const distDirectory = path.resolve(currentDirectory, "..", "dist");

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "10kb" }));
  app.use((request, response, next) => {
    response.set("X-Content-Type-Options", "nosniff");
    response.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.set("X-Frame-Options", "DENY");
    next();
  });

  app.get("/api/health", (request, response) => response.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/game", gameRoutes);

  if (fs.existsSync(distDirectory)) {
    app.use(express.static(distDirectory));
    app.get("*path", (request, response) =>
      response.sendFile(path.join(distDirectory, "index.html")),
    );
  }

  app.use((error, request, response, next) => {
    console.error("Ошибка API:", error);
    if (response.headersSent) return next(error);
    response.status(error.status || 500).json({
      error: error.status ? error.message : "Внутренняя ошибка сервера. Попробуйте ещё раз.",
    });
  });

  return app;
}
