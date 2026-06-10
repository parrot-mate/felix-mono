import type { AiParseResult } from "../models/reminder";
import { createFutureIso } from "../utils/time";

export async function mockParseReminder(spokenText: string, shouldFail = false): Promise<AiParseResult> {
  await delay(460);
  if (shouldFail) {
    throw new Error("AI 暂时没有理解这条提醒");
  }

  return parseReminder(spokenText);
}

export function parseReminder(spokenText: string): AiParseResult {
  if (spokenText.includes("每天") || spokenText.includes("泡脚")) {
    return {
      title: "泡脚",
      scheduledAt: createFutureIso(0, 22, 0),
      repeatRule: "每天",
      confidence: 0.94,
      needsManualTime: false
    };
  }

  if (spokenText.includes("明早") || spokenText.includes("带电脑")) {
    return {
      title: "带电脑",
      scheduledAt: createFutureIso(1, 8, 0),
      confidence: 0.91,
      needsManualTime: false
    };
  }

  return {
    title: spokenText.replace(/^提醒我/, "") || "新的提醒",
    confidence: 0.52,
    needsManualTime: true
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

