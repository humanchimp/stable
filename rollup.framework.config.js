import config from "./rollup.config";

export default {
  ...config,
  input: 'src/framework/lib.ts',
  output: {
    file: 'dist/framework.js',
    format: 'esm',
    sourcemap: 'inline',
  },
  external: [],
};
