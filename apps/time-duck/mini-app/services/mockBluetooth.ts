import type { BluetoothDeviceState } from "../models/uiState";

export function createDisconnectedBluetooth(): BluetoothDeviceState {
  return { status: "disconnected" };
}

export async function mockConnectBluetooth(shouldFail = false): Promise<BluetoothDeviceState> {
  await delay(420);
  if (shouldFail) {
    return {
      status: "failed",
      errorMessage: "没有找到 Time Duck 设备"
    };
  }

  return {
    status: "connected",
    deviceName: "Time Duck Mini"
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

