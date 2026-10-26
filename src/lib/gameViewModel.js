import { buttonTypes } from "../../shared/gameData.js";
import {
  automationMultiplier,
  autoRate,
  clickPower,
  currentRunLevel,
  incomeMultiplier,
  nextSectorThreshold,
  nextSoulThreshold,
  resonanceMultiplier,
  sectorReward,
  soulReward,
} from "./gameMath.js";

export function createGameViewModel(state) {
  const soulsToEarn = soulReward(state);
  const syncLevel = state.tree.resonance || 0;

  return {
    selectedButton: buttonTypes.find((button) => button.id === state.selected) || buttonTypes[0],
    runLevel: currentRunLevel(state.totalEarned),
    soulsToEarn,
    canRebirth: soulsToEarn > 0,
    soulThreshold: nextSoulThreshold(state),
    sectorRewardAmount: sectorReward(state),
    sectorThreshold: nextSectorThreshold(state),
    automaticIncome: autoRate(state),
    manualIncome: clickPower(state),
    incomeMultiplier: incomeMultiplier(state),
    syncLevel,
    syncProgress: syncLevel ? ((state.totalClicks % 25) / 25) * 100 : 0,
    syncBonusPercent: Math.round((resonanceMultiplier(state) - 1) * 100),
    boostedAutoMultiplier: automationMultiplier(state),
  };
}
