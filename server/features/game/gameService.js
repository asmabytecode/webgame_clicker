import { applyGameAction, accrueAutoIncome } from "./game.js";
import { updateGameState } from "../../infrastructure/database.js";
import { runCasualAutomation } from "./casualManager.js";

export function getPlayerGameState(userId) {
  return updateGameState(userId, (state) => {
    accrueAutoIncome(state);
    if (state.casualMode) runCasualAutomation(state);
    return state;
  });
}

export function applyPlayerGameAction(userId, action) {
  return updateGameState(userId, (state) => {
    accrueAutoIncome(state);
    const result = applyGameAction(state, action);
    if (state.casualMode) runCasualAutomation(state);
    return result;
  });
}
