declare function App(options: any): void;
declare function Page(options: any): void;
declare function Component(options: any): void;

declare const wx: {
  showToast(options: { title: string; icon?: "none" | "success" | "error"; duration?: number }): void;
  vibrateShort(options?: { type?: "light" | "medium" | "heavy" }): void;
};
