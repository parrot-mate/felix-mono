module.exports = {
  apps: [
    {
      name: "pmate-proxy",
      cwd: __dirname,
      script: "./dist/index.js",
      exec_mode: "fork",
      interpreter: "node",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
}
