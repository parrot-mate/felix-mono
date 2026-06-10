export type ReminderStatus = "scheduled" | "pending_time" | "alarm_failed" | "done";

export interface Reminder {
  id: string;
  title: string;
  spokenText: string;
  scheduledAt?: string;
  repeatRule?: string;
  status: ReminderStatus;
  alarmSet: boolean;
  createdAt: string;
}

export interface AiParseResult {
  title: string;
  scheduledAt?: string;
  repeatRule?: string;
  confidence: number;
  needsManualTime: boolean;
}

export type ReminderFilter = "all" | "future" | "pending";

