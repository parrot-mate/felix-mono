Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    reminder: {
      type: Object,
      value: null
    }
  },
  methods: {
    noop() {},
    close(this: any) {
      this.triggerEvent("close");
    },
    retryAlarm(this: any) {
      this.triggerEvent("retryalarm");
    }
  }
});
