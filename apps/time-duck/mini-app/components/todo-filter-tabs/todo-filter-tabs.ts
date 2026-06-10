Component({
  properties: {
    active: {
      type: String,
      value: "all"
    }
  },
  methods: {
    change(this: any, event: { currentTarget: { dataset: { value: string } } }) {
      this.triggerEvent("change", { value: event.currentTarget.dataset.value });
    }
  }
});
