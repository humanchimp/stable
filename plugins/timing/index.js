import packageJson from "./package.json";

export function timing(config) {
  config = [].concat(config).pop();

  return {
    package: packageJson,

    provides: {
      listeners: "./listeners.js",
    },

    config,
  };
}
