import type { AiParseResult, Reminder } from "../../models/reminder";
import type { BluetoothDeviceState, ParseStep, VoiceStatus } from "../../models/uiState";
import { createDisconnectedBluetooth, mockConnectBluetooth } from "../../services/mockBluetooth";
import { mockRecognizeVoice } from "../../services/mockVoice";
import { mockParseReminder } from "../../services/mockAiParser";
import { mockSetAlarm } from "../../services/mockAlarm";
import { formatDisplayTime } from "../../utils/time";

interface ReminderView extends Reminder {
  displayTime: string;
  statusLabel: string;
}

interface ParseResultView extends AiParseResult {
  displayTime: string;
}

interface ToastState {
  visible: boolean;
  message: string;
  tone: "success" | "warning" | "error";
}

type ActiveTab = "voice" | "list";

const initialReminders: Reminder[] = [];

const waitingSteps: ParseStep[] = [
  { id: "voice", label: "识别语音内容", status: "waiting" },
  { id: "time", label: "判断提醒时间", status: "waiting" },
  { id: "alarm", label: "设置手机闹钟", status: "waiting" }
];

Page({
  data: {
    bluetooth: createDisconnectedBluetooth() as BluetoothDeviceState,
    reminders: initialReminders,
    visibleReminders: toViewReminders(initialReminders),
    recentReminder: createRecentReminder(initialReminders),
    activeTab: "voice" as ActiveTab,
    emptyTitle: "还没有提醒",
    voiceStatus: "idle" as VoiceStatus,
    recordingSeconds: 0,
    parseSheetVisible: false,
    detailSheetVisible: false,
    parseSteps: waitingSteps,
    spokenText: "",
    parseResult: null as ParseResultView | null,
    pendingReminder: null as Reminder | null,
    selectedReminder: null as ReminderView | null,
    toast: { visible: false, message: "", tone: "success" } as ToastState
  },

  async handleBluetoothConnect() {
    this.setData({ bluetooth: { status: "searching" } });
    await wait(300);
    this.setData({ bluetooth: { status: "connecting", deviceName: "Time Duck" } });
    const bluetooth = await mockConnectBluetooth();
    this.setData({ bluetooth });
    this.showToast("蓝牙已连接", "success");
  },

  async handleBluetoothRetry() {
    await this.handleBluetoothConnect();
  },

  async handleBluetoothTap() {
    const bluetooth = this.data.bluetooth as BluetoothDeviceState;
    if (bluetooth.status === "connected") {
      this.showToast("设备已连接", "success");
      return;
    }
    if (bluetooth.status === "searching" || bluetooth.status === "connecting") {
      return;
    }
    await this.handleBluetoothConnect();
  },

  handleTabChange(event: { currentTarget: { dataset: { tab: ActiveTab } } }) {
    const activeTab = event.currentTarget.dataset.tab;
    if (activeTab) {
      this.setData({ activeTab });
    }
  },

  handleVoiceStart() {
    this.setData({
      voiceStatus: "recording",
      recordingSeconds: 1,
      parseSheetVisible: false,
      parseSteps: waitingSteps,
      spokenText: "",
      parseResult: null,
      pendingReminder: null
    });
    wx.vibrateShort({ type: "light" });
  },

  handleVoiceCancel() {
    this.setData({ voiceStatus: "idle", recordingSeconds: 0 });
    this.showToast("已取消录音", "warning");
  },

  async handleVoiceFinish() {
    this.setData({
      voiceStatus: "recognizing",
      parseSheetVisible: true,
      parseSteps: markStep("voice", "active")
    });

    try {
      const spokenText = await mockRecognizeVoice();
      this.setData({
        spokenText,
        voiceStatus: "parsing",
        parseSteps: [
          { id: "voice", label: "识别语音内容", status: "done" },
          { id: "time", label: "判断提醒时间", status: "active" },
          { id: "alarm", label: "设置手机闹钟", status: "waiting" }
        ]
      });

      const parseResult = toParseResultView(await mockParseReminder(spokenText));
      this.setData({
        parseResult,
        voiceStatus: "setting_alarm",
        parseSteps: [
          { id: "voice", label: "识别语音内容", status: "done" },
          { id: "time", label: "判断提醒时间", status: "done" },
          { id: "alarm", label: "设置手机闹钟", status: parseResult.needsManualTime ? "waiting" : "active" }
        ]
      });

      const reminder = await mockSetAlarm(parseResult, spokenText);
      this.setData({
        pendingReminder: reminder,
        voiceStatus: "success",
        parseSteps: [
          { id: "voice", label: "识别语音内容", status: "done" },
          { id: "time", label: "判断提醒时间", status: parseResult.needsManualTime ? "failed" : "done" },
          { id: "alarm", label: "设置手机闹钟", status: reminder.alarmSet ? "done" : parseResult.needsManualTime ? "waiting" : "failed" }
        ]
      });
    } catch (error) {
      this.setData({
        voiceStatus: "failed",
        parseSteps: [
          { id: "voice", label: "识别语音内容", status: "done" },
          { id: "time", label: "判断提醒时间", status: "failed" },
          { id: "alarm", label: "设置手机闹钟", status: "waiting" }
        ]
      });
      this.showToast(error instanceof Error ? error.message : "解析失败", "error");
    }
  },

  handleConfirmParsedReminder() {
    const pendingReminder = this.data.pendingReminder as Reminder | null;
    if (!pendingReminder) {
      return;
    }

    const reminders = [pendingReminder, ...this.data.reminders];
    this.setData({
      reminders,
      visibleReminders: toViewReminders(reminders),
      recentReminder: createRecentReminder(reminders),
      parseSheetVisible: false,
      voiceStatus: "idle",
      pendingReminder: null,
      recordingSeconds: 0
    });
    this.showToast(pendingReminder.alarmSet ? "已加入待提醒" : "待补时间", pendingReminder.alarmSet ? "success" : "warning");
  },

  async handleRetryParse() {
    await this.handleVoiceFinish();
  },

  handleCloseParseSheet() {
    this.setData({ parseSheetVisible: false, voiceStatus: "idle" });
  },

  handleSelectReminder(event: { detail: { id: string } }) {
    const reminder = this.data.reminders.find((item: Reminder) => item.id === event.detail.id);
    if (!reminder) {
      return;
    }
    this.setData({ selectedReminder: toViewReminder(reminder), detailSheetVisible: true });
  },

  handleCloseDetail() {
    this.setData({ detailSheetVisible: false, selectedReminder: null });
  },

  async handleRetryAlarm(event: { detail: { id: string } }) {
    await this.retryAlarm(event.detail.id);
  },

  async handleRetrySelectedAlarm() {
    const selectedReminder = this.data.selectedReminder as ReminderView | null;
    if (selectedReminder) {
      await this.retryAlarm(selectedReminder.id);
      this.setData({ detailSheetVisible: false, selectedReminder: null });
    }
  },

  async retryAlarm(id: string) {
    const reminders = this.data.reminders.map((item: Reminder) => (
      item.id === id && item.scheduledAt
        ? { ...item, status: "scheduled" as const, alarmSet: true }
        : item
    ));
    await wait(240);
    this.setData({
      reminders,
      visibleReminders: toViewReminders(reminders),
      recentReminder: createRecentReminder(reminders)
    });
    this.showToast("已加入待提醒", "success");
  },

  showToast(message: string, tone: ToastState["tone"]) {
    this.setData({ toast: { visible: true, message, tone } });
    setTimeout(() => {
      this.setData({ toast: { visible: false, message: "", tone } });
    }, 1500);
  }
});

function toViewReminders(reminders: Reminder[]): ReminderView[] {
  return reminders.map(toViewReminder);
}

function toViewReminder(reminder: Reminder): ReminderView {
  const labels: Record<Reminder["status"], string> = {
    scheduled: "待提醒",
    pending_time: "待补时间",
    alarm_failed: "设置失败",
    done: "已提醒"
  };

  return {
    ...reminder,
    displayTime: formatDisplayTime(reminder.scheduledAt),
    statusLabel: labels[reminder.status]
  };
}

function createRecentReminder(reminders: Reminder[]): ReminderView | null {
  const recent = reminders.find((item) => item.status !== "done") ?? reminders[0];
  return recent ? toViewReminder(recent) : null;
}

function toParseResultView(result: AiParseResult): ParseResultView {
  return {
    ...result,
    displayTime: formatDisplayTime(result.scheduledAt)
  };
}

function markStep(id: string, status: ParseStep["status"]): ParseStep[] {
  return waitingSteps.map((step) => ({ ...step, status: step.id === id ? status : step.status }));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
