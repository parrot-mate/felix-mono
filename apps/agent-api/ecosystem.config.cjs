module.exports = {
  apps: [
    {
      name: "agent-api",
      cwd: __dirname,
      script: "bun",
      args: "run src/index.ts",
      interpreter: "none", // important
      env: {
        PORT: "9109",
      },
    },
  ],
}
