import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'cypress/wasmTerminal.js',
  output: {
    file: 'cypress/wasmTerminal.bundle.js',
    format: 'iife',
  },
  plugins: [nodeResolve()]
};
