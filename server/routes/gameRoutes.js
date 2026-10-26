import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { applyPlayerGameAction } from "../services/gameService.js";

const router = Router();

router.post("/action", requireAuth, (request, response, next) => {
  try {
    const result = applyPlayerGameAction(request.user.id, request.body);
    response.json({ state: result.state, reward: result.reward });
  } catch (error) {
    next(error);
  }
});

export default router;
