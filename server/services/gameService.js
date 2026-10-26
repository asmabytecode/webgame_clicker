import { applyGameAction, accrueAutoIncome } from "../game.js";
import { loadAndUpdateGame, updateGameState } from "../database.js";

export function getPlayerGameState(userId) {
  return loadAndUpdateGame(userId);
}

export function applyPlayerGameAction(userId, action) {
  return updateGameState(userId, (state) => {
    accrueAutoIncome(state);
    return applyGameAction(state, action);
  });
}
