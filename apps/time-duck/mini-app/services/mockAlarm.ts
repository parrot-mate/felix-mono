import type { AiParseResult, Reminder } from "../models/reminder";

export async function mockSetAlarm(result: AiParseResult, spokenText: string, shouldFail = false): Promise<Reminder> {
  await delay(360);

  const hasTime = Boolean(result.scheduledAt) && !result.needsManualTime;
  const alarmSet = hasTime && !shouldFail;

  return {
    id: `reminder-${Date.now()}`,
    title: result.title,
    spokenText,
    scheduledAt: result.scheduledAt,
    repeatRule: result.repeatRule,
    status: result.needsManualTime ? "pending_time" : alarmSet ? "scheduled" : "alarm_failed",
    alarmSet,
    createdAt: new Date().toISOString()
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

