import { format } from "./gameMath.js";

export function getActionFeedback(type, result) {
  if (type === "rebirth") return `Возрождение: +${format(result.reward)} SOUL`;
  if (type === "sectorReset") return `Экспедиция завершена: +${format(result.reward)} RELIC`;
  if (type === "claimContract") return `Контракт закрыт: +${format(result.researchReward)} DATA`;
  if (type === "claimMilestone") return `Этап пройден: +${format(result.reward)} RELIC`;
  if (type === "reset") return "Прогресс игры сброшен";

  if (type === "click" && (result.critical || result.lucky)) {
    const bonus =
      result.critical && result.lucky
        ? "Критический бонус и удача"
        : result.critical
          ? "Критический бонус"
          : "Удача";
    return `${bonus}: +${format(result.reward)} CR`;
  }

  if (["buyNode", "buySoul", "buyResearch", "buyRelic"].includes(type))
    return "Улучшение приобретено";
  if (type === "chooseSkin") return "Профиль кнопки изменён";
  return "";
}
