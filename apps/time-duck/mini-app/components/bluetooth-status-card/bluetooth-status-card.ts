Component({
  properties: {
    bluetooth: {
      type: Object,
      value: {}
    }
  },
  methods: {
    handleConnect(this: any) {
      this.triggerEvent("connect");
    },
    handleRetry(this: any) {
      this.triggerEvent("retry");
    }
  }
});
