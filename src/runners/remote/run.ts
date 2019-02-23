import { sock } from "./sock";
import { uploadReports } from "./uploadReports";

let ready = false;

declare var __coverage__: any;

export async function run(suite) {
  if (ready) {
    await uploadReports(suite);
    if (typeof __coverage__ !== "undefined") {
      await sock.send(JSON.stringify({ __coverage__ }));
    }
    sock.close(1000);
  } else {
    sock.addEventListener("open", () => {
      ready = true;
      run(suite);
    });
  }
}
