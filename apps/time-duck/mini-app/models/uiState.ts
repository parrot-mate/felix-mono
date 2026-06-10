export type AuthStatus = "logged_out" | "logging_in" | "logged_in" | "failed";
export type BluetoothStatus = "disconnected" | "searching" | "connecting" | "connected" | "failed";
export type VoiceStatus = "idle" | "recording" | "recognizing" | "parsing" | "setting_alarm" | "success" | "failed";

export interface UserProfile {
  nickName: string;
  avatarText: string;
}

export interface BluetoothDeviceState {
  status: BluetoothStatus;
  deviceName?: string;
  errorMessage?: string;
}

export interface ParseStep {
  id: string;
  label: string;
  status: "waiting" | "active" | "done" | "failed";
}

