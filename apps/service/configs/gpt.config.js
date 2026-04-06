module.exports = {
  apps: [
    {
      name: "gpt",
      script: "proxychains4",
      args: '../dist/runner/index.js -- "@gpt#1"',
      interpreter: "node",
    },
  ],
}
