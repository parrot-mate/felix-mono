module.exports = {
  apps: [
    {
      name: "chat-rest",
      cwd: __dirname,
      script: "bun",
      args: "run src/index.ts",
      interpreter: "none", // important
      env: {
        PORT: "9101",
      },
    },
  ],
}
