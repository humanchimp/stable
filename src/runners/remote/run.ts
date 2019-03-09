import { Sock } from "./Sock";
import { Suite } from "../../interfaces";
import { Selection } from "../../framework/Selection";
import { serializeReason } from "../../serializeReason";
import { parseSelectionParams } from "./parseSelectionParams";
import { implForSort } from "../../cli/task/RunTask/implForSort";
import { setupVconsole } from "../../cli/task/RunTask/Vconsole";
import { runSuite } from "../../cli/task/RunTask/runSuite";
import { CliArgKey, OptionType } from "../../enums";
import { castValue } from "../../cli/castValue";

declare var __coverage__: any;

export async function run(suite: Suite): Promise<void> {
  const sock = new Sock("ws://0.0.0.0:10001/ws");

  await sock.opened;

  setupVconsole(suite, sock.console.bind(sock));

  const { searchParams } = new URL(location.href);
  const selection = new Selection(parseSelectionParams(searchParams));

  for await (const message of runSuite(
    suite,
    selection,
    implForSort(searchParams.get(CliArgKey.SORT)),
    castValue(
      searchParams.get(CliArgKey.FAIL_FAST),
      OptionType.BOOLEAN,
    ) as boolean,
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
