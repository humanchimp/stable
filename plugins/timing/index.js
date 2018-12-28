import packageJson from './package.json';

export function timing(config) {
  return {
    package: packageJson,

    provides: {
      listeners: './listeners.js'
    },

    config,
  };
}
