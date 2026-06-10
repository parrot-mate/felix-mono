Component({
  data: {
    startY: 0,
    cancelIntent: false
  },
  properties: {
    status: {
      type: String,
      value: "idle"
    },
    recordingSeconds: {
      type: Number,
      value: 0
    }
  },
  methods: {
    handleTouchStart(this: any, event: { touches?: Array<{ clientY: number }> }) {
      if (this.data.status === "idle") {
        const startY = event.touches?.[0]?.clientY ?? 0;
        this.setData({ startY, cancelIntent: false });
        this.triggerEvent("start");
      }
    },
    handleTouchMove(this: any, event: { touches?: Array<{ clientY: number }> }) {
      if (this.data.status === "recording" || this.data.startY > 0) {
        const currentY = event.touches?.[0]?.clientY ?? this.data.startY;
        const cancelIntent = this.data.startY - currentY > 56;
        if (cancelIntent !== this.data.cancelIntent) {
          this.setData({ cancelIntent });
        }
      }
    },
    handleTouchEnd(this: any) {
      if (this.data.status === "recording" || this.data.startY > 0) {
        if (this.data.cancelIntent) {
          this.triggerEvent("cancel");
        } else {
          this.triggerEvent("finish");
        }
        this.setData({ startY: 0, cancelIntent: false });
      }
    },
    handleTouchCancel(this: any) {
      if (this.data.status === "recording" || this.data.startY > 0) {
        this.triggerEvent("cancel");
        this.setData({ startY: 0, cancelIntent: false });
      }
    },
    retry(this: any) {
      if (this.data.status === "failed") {
        this.triggerEvent("finish");
      }
    }
  }
});
