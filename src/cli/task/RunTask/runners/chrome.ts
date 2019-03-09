import { run as runRemote } from "./remote";
import { RunTaskParams } from "../../../../interfaces";
import { CliArgKey } from "../../../../enums";

export function run(code, params: RunTaskParams) {
  return runRemote(
    code,
    () => {
      const remoteDebuggingPortFlag = "--remote-debugging-port=9222";

      return [
        chromePathForPlatform(),
        params[CliArgKey.HEADFUL]
          ? [remoteDebuggingPortFlag]
          : ["--headless", remoteDebuggingPortFlag],
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
