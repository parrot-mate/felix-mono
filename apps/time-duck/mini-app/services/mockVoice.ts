const mockPhrases = [
  "明早八点提醒我带电脑",
  "每天晚上十点提醒我泡脚",
  "提醒我整理一下桌面"
];

let cursor = 0;

export async function mockRecognizeVoice(): Promise<string> {
  await delay(360);
  const phrase = mockPhrases[cursor % mockPhrases.length];
  cursor += 1;
  return phrase;
}

export function resetMockVoiceCursor(): void {
  cursor = 0;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

