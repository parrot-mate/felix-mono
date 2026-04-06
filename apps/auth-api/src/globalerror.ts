function logError(error: any) {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] Error: ${error.stack || error}\n`
  console.error(message)
}

process.on("uncaughtException", (error) => {
  logError(error)
})

process.on("unhandledRejection", (reason) => {
  logError(reason)
})
