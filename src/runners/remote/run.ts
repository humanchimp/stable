import { Sock } from "./Sock";
import { Suite } from "../../framework/interfaces";
import { Selection } from "../../framework/Selection";
import { serializeReason } from "../../serializeReason";
import { parseSelectionParams } from "./parseSelectionParams";
import { implForSort } from "../../cli/task/RunTask/implForSort";

declare var __coverage__: any;

// function log(...args) {
//   sock.send(JSON.stringify({ console: { method: "log", args } }));
// }

export async function run(suite: Suite): Promise<void> {
  const sock = new Sock(`ws://0.0.0.0:10001/ws`);

  await sock.opened;

  const { searchParams } = new URL(location.href);
  const selection = new Selection(parseSelectionParams(searchParams));

  for await (const message of suite.run(
    implForSort(searchParams.get("sort")),
    selection.predicate,
  )) {
    if ("planned" in message && message.planned != null) {
      // Append the user agent to the plan and summary
      message.userAgent = navigator.userAgent;
    }
    if ("reason" in message && message.reason != null) {
      message.reason = serializeReason(message.reason);
    }
    sock.message(message);
  }
  if (typeof __coverage__ !== "undefined") {
    sock.message({ __coverage__ });
  }
  await sock.close(1000);
}
