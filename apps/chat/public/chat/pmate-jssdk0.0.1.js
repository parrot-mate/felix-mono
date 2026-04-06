;(function (global) {
  function randomId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
  }

  const pending = {}
  const nativeBridge = global.PmateBridge || {}

  function call(functionName, params) {
    if (!window.isPmate) {
      return
    }
    const id = randomId()
    const payload = params ? JSON.stringify(params) : ""
    return new Promise((resolve, reject) => {
      pending[id] = { resolve, reject }
      try {
        nativeBridge.call(id, functionName, payload)
      } catch (err) {
        delete pending[id]
        reject(err)
      }
    })
  }

  function __notify(event) {
    try {
      event = typeof event === "string" ? JSON.parse(event) : event
    } catch (e) {
      return
    }
    const { id, data, error, success } = event || {}
    const callback = pending[id]
    if (!callback) {
      return
    }
    delete pending[id]
    if (success) {
      callback.resolve(data)
    } else {
      callback.reject(error)
    }
  }

  global.PmateBridge = {
    call,
    __notify,
  }
})(typeof window !== "undefined" ? window : {})
