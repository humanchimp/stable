import packageJson from './package.json';

export function rescue() {
  return {
    package: packageJson,

    provides: {
      listeners: './listeners.js'
    },
  };
}
