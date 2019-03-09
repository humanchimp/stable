import { run as runRemote } from "./remote";

export function run(code, params) {
  return runRemote(
    code,
    () => {
      return [
        chromePathForPlatform(),
        ["--headless", "--remote-debugging-port=9222"],
      ];
    },
    params,
  );
}

export function chromePathForPlatform() {
  switch (process.platform) {
    case "darwin":
      return "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
    case "linux":
      return "/usr/bin/google-chrome"; // This is gonna be way too naive
  }
  throw new Error("Sorry, your platform is not currently supported.");
}
