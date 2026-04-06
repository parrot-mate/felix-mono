module.exports = {
  plugins: {
    "@csstools/postcss-cascade-layers": {}, // flatten @layer rules
    "postcss-env-function": { preserve: true },
    "postcss-preset-env": {
      stage: 1,
      features: {
        "nesting-rules": true,
        clamp: true,
      },
    },
    autoprefixer: {}, // for cross-browser prefixes
  },
}
