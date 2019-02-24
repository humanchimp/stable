import { sock } from "./sock";
import { Suite } from "../../framework/interfaces";
import { Selection } from "../../framework/Selection";
import { serializeReason } from "../../serializeReason";
import { parseSelectionParams } from "./parseSelectionParams";
import { implForSort } from "../../cli/task/RunTask/implForSort";

let ready = false;

sock.addEventListener(
  "open",
  () => {
    ready = true;
  },
  { once: true },
);

declare var __coverage__: any;

// function log(...args) {
//   sock.send(JSON.stringify({ console: { method: "log", args } }));
// }

export async function run(suite: Suite): Promise<void> {
  if (ready) {
    const { searchParams } = new URL(location.href);
    const selection = new Selection(parseSelectionParams(searchParams));

    for await (const message of suite.run(
      implForSort(searchParams.get("sort")),
      selection.predicate,
    )) {
      if (message.planned != null) {
        // Append the user agent to the plan and summary
        message.userAgent = navigator.userAgent;
      }
      if ("reason" in message && message.reason != null) {
        message.reason = serializeReason(message.reason);
      }
      sock.send(JSON.stringify({ message }));
    }
    if (typeof __coverage__ !== "undefined") {
      await sock.send(JSON.stringify({ message: { __coverage__ } }));
    }
    sock.close(1000);
  } else {
    sock.addEventListener("open", () => {
      ready = true;
      run(suite);
    });
  }
}
