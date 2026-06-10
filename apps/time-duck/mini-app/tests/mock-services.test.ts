import { describe, expect, it } from "vitest";
import { mockSetAlarm } from "../services/mockAlarm";
import { parseReminder } from "../services/mockAiParser";
import { formatDisplayTime } from "../utils/time";

describe("Time Duck services", () => {
  it("parses a clear morning reminder", () => {
    const result = parseReminder("明早八点提醒我带电脑");

    expect(result.title).toBe("带电脑");
    expect(result.needsManualTime).toBe(false);
    expect(result.scheduledAt).toBeTruthy();
  });

  it("parses repeat reminders", () => {
    const result = parseReminder("每天晚上十点提醒我泡脚");

    expect(result.title).toBe("泡脚");
    expect(result.repeatRule).toBe("每天");
    expect(result.needsManualTime).toBe(false);
  });

  it("marks reminders without time as pending", () => {
    const result = parseReminder("提醒我整理一下桌面");

    expect(result.title).toBe("整理一下桌面");
    expect(result.needsManualTime).toBe(true);
    expect(result.scheduledAt).toBeUndefined();
  });

  it("creates scheduled reminders when alarm succeeds", async () => {
    const result = parseReminder("明早八点提醒我带电脑");
    const reminder = await mockSetAlarm(result, "明早八点提醒我带电脑");

    expect(reminder.status).toBe("scheduled");
    expect(reminder.alarmSet).toBe(true);
  });

  it("keeps reminders when alarm fails", async () => {
    const result = parseReminder("明早八点提醒我带电脑");
    const reminder = await mockSetAlarm(result, "明早八点提醒我带电脑", true);

    expect(reminder.status).toBe("alarm_failed");
    expect(reminder.alarmSet).toBe(false);
  });

  it("formats empty reminder time as pending", () => {
    expect(formatDisplayTime()).toBe("待补时间");
  });
});
