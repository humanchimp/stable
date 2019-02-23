import { sock } from "./sock";
import { serializeReason } from "../../serializeReason";

export async function uploadReports(suite) {
  for await (const message of suite.run()) {
    if (message.planned != null) {
      // Append the user agent to the plan and summary
      message.userAgent = navigator.userAgent;
    }
    if (message.reason != null) {
      message.reason = serializeReason(message.reason);
    }
    sock.send(JSON.stringify(message));
  }
}
