// Function to log errors
function logError(error: any) {
  const timestamp = new Date().toISOString()
  const message = `[${timestamp}] Error: ${error.stack || error}\n`
  console.error(message) // Log to console for immediate feedback
}

// Catch uncaught exceptions
process.on("uncaughtException", (error) => {
  logError(error)
  // Optionally exit process if needed, though it's often better to recover if possible
  // process.exit(1);
})

// Catch unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logError(reason)
  // Note: In future Node.js versions, unhandled rejections may terminate the process
})
