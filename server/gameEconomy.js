import { dailyContracts } from "../shared/gameData.js";
import { autoRate, offlineCapSeconds } from "../shared/gameMath.js";
import { normalizeDaily } from "./gameState.js";

const contractById = (id) => dailyContracts.find((contract) => contract.id === id);

export function trackDaily(state, id, amount) {
  const contract = contractById(id);
  if (!contract || !Number.isFinite(amount) || amount <= 0) return;
  state.daily.progress[id] = Math.min(contract.target, state.daily.progress[id] + amount);
}

export function earn(state, amount, { countForDaily = true } = {}) {
  if (!Number.isFinite(amount) || amount <= 0) return;
  state.coins += amount;
  state.totalEarned += amount;
  state.allTimeEarned += amount;
  if (countForDaily) trackDaily(state, "dailyIncome", amount);
}

export function accrueAutoIncome(state, now = Date.now()) {
  state.daily = normalizeDaily(state.daily, now);
  const elapsed = Math.max(0, Math.min(offlineCapSeconds(state), (now - state.lastTickAt) / 1000));
  state.lastTickAt = now;
  const earned = autoRate(state) * elapsed;
  earn(state, earned);
  return earned;
}
