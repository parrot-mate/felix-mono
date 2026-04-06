import dts from "rollup-plugin-dts";

const external = [
  "react",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "jotai",
  "jotai-family",
];

export default [
  {
    input: "src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts()],
    external,
  },
];
