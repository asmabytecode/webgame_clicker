import { Router } from "express";
import { requireAuth } from "../auth/authMiddleware.js";
import { getLeaderboard } from "../leaderboard/leaderboardService.js";
import { applyPlayerGameAction } from "./gameService.js";

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
    response.json({
      state: result.state,
      reward: result.reward,
      researchReward: result.researchReward,
      coinReward: result.coinReward,
      artifact: result.artifact,
      challenge: result.challenge,
      boss: result.boss,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
