import { buttonTypes } from "@shared/game/gameData.js";
import {
  automationMultiplier,
  ascensionReward,
  ascensionThreshold,
  autoRate,
  clickPower,
  currentSector,
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
    sector: currentSector(state),
    runLevel: currentRunLevel(state.totalEarned),
    soulsToEarn,
    canRebirth: soulsToEarn > 0,
    soulThreshold: nextSoulThreshold(state),
    sectorRewardAmount: sectorReward(state),
    sectorThreshold: nextSectorThreshold(state),
    ascensionReward: ascensionReward(state),
    ascensionThreshold: ascensionThreshold(state),
    automaticIncome: autoRate(state),
    manualIncome: clickPower(state),
    incomeMultiplier: incomeMultiplier(state),
    syncLevel,
    syncProgress: syncLevel ? ((state.totalClicks % 25) / 25) * 100 : 0,
    syncBonusPercent: Math.round((resonanceMultiplier(state) - 1) * 100),
    boostedAutoMultiplier: automationMultiplier(state),
  };
}
