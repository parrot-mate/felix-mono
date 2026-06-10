Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    status: {
      type: String,
      value: "idle"
    },
    steps: {
      type: Array,
      value: []
    },
    spokenText: {
      type: String,
      value: ""
    },
    parseResult: {
      type: Object,
      value: null
    }
  },
  methods: {
    noop() {},
    confirm(this: any) {
      this.triggerEvent("confirm");
    },
    retry(this: any) {
      this.triggerEvent("retry");
    },
    close(this: any) {
      this.triggerEvent("close");
    }
  }
});
