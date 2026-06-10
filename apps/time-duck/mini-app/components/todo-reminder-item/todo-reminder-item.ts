Component({
  properties: {
    reminder: {
      type: Object,
      value: {}
    }
  },
  methods: {
    select(this: any) {
      this.triggerEvent("select", { id: this.data.reminder.id });
    },
    retryAlarm(this: any) {
      this.triggerEvent("retryalarm", { id: this.data.reminder.id });
    }
  }
});
