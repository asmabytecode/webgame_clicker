import { Router } from "express";
import { loginUser, registerUser, removeSession } from "./authService.js";
import {
  clearSessionCookie,
  cookieName,
  readCookie,
  requireAuth,
  setSessionCookie,
} from "./authMiddleware.js";
import { authRateLimit } from "./authRateLimit.js";
import { getPlayerGameState } from "../game/gameService.js";

const router = Router();

router.post("/register", authRateLimit, async (request, response, next) => {
  try {
    const result = await registerUser(request.body?.username, request.body?.password);
    setSessionCookie(response, result.token);
    response.status(201).json({ user: result.user, state: result.state });
  } catch (error) {
    next(error);
  }
});

router.post("/login", authRateLimit, async (request, response, next) => {
  try {
    const result = await loginUser(request.body?.username, request.body?.password);
    setSessionCookie(response, result.token);
    response.json({ user: result.user, state: result.state });
  } catch (error) {
    next(error);
  }
});

router.get("/me", requireAuth, (request, response, next) => {
  try {
    response.json({
      user: { username: request.user.username },
      state: getPlayerGameState(request.user.id),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", requireAuth, (request, response) => {
  const token = readCookie(request, cookieName);
  removeSession(token);
  clearSessionCookie(response);
  response.status(204).end();
});

export default router;
