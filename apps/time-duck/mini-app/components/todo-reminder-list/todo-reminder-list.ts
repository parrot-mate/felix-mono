Component({
  properties: {
    reminders: {
      type: Array,
      value: []
    },
    emptyTitle: {
      type: String,
      value: "还没有提醒"
    }
  },
  methods: {
    select(this: any, event: { detail: { id: string } }) {
      this.triggerEvent("select", event.detail);
    },
    retryAlarm(this: any, event: { detail: { id: string } }) {
      this.triggerEvent("retryalarm", event.detail);
    }
  }
});
