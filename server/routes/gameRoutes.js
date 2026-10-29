import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { applyPlayerGameAction } from "../services/gameService.js";
import { getLeaderboard } from "../services/leaderboardService.js";

const router = Router();

router.get("/leaderboard", requireAuth, (request, response, next) => {
  try {
    const category = request.query.category || "earned";
    response.json(getLeaderboard(category, request.user.id));
  } catch (error) {
    next(error);
  }
});

router.post("/action", requireAuth, (request, response, next) => {
  try {
    const result = applyPlayerGameAction(request.user.id, request.body);
    response.json({ state: result.state, reward: result.reward });
  } catch (error) {
    next(error);
  }
});

export default router;
