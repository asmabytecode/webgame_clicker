import { format } from "./gameMath.js";

export function getActionFeedback(type, result) {
  if (type === "rebirth") return `Возрождение: +${format(result.reward)} SOUL`;
  if (type === "sectorReset") return `Экспедиция завершена: +${format(result.reward)} RELIC`;
  if (type === "ascend") return `Вознесение: +${format(result.reward)} CORE`;
  if (type === "setCasualMode")
    return result.state.casualMode ? "Казуальный режим включён" : "Казуальный режим выключен";
  if (type === "claimMilestone") return `Этап пройден: +${format(result.reward)} RELIC`;
  if (type === "claimBoss") {
    return result.artifact
      ? `Босс побеждён: +1 RELIC · найден артефакт «${result.artifact.name}»`
      : "Босс побеждён: +1 RELIC";
  }
  if (type === "claimAchievement") return `Достижение получено: +${format(result.reward)} RELIC`;
  if (type === "claimChapter") return `Глава пройдена: +${format(result.reward)} RELIC`;
  if (type === "equipArtifact") return `Артефакт активирован: ${result.artifact.name}`;
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

  if (["buyNode", "buySoul", "buyRelic", "buyAscension"].includes(type))
    return "Улучшение приобретено";
  if (type === "buyMax") return `Покупок: ${result.purchases}`;
  if (type === "chooseSkin") return "Профиль кнопки изменён";
  return "";
}
