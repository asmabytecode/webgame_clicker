import { bossHealth } from "../../../shared/game/gameData.js";
import { autoRate, offlineCapSeconds } from "../../../shared/game/gameMath.js";

export function earn(state, amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  state.coins += amount;
  state.totalEarned += amount;
  state.allTimeEarned += amount;
  state.bossDamage = Math.min(bossHealth(state.bossesDefeated), state.bossDamage + amount);
}

export function accrueAutoIncome(state, now = Date.now()) {
  const elapsed = Math.max(0, Math.min(offlineCapSeconds(state), (now - state.lastTickAt) / 1000));
  state.lastTickAt = now;
  const earned = autoRate(state) * elapsed;
  earn(state, earned);
  return earned;
}
