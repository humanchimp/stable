import config from "./rollup.config";

export default {
  ...config,
  input: 'src/runners/remote/run.ts',
  output: {
    file: 'dist/runners/remote.js',
    format: 'esm',
    sourcemap: 'inline',
  },
  external: [],
};
