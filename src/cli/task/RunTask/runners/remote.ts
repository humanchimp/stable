import { spawn } from "child_process";
import { createServer } from "http";
import { fromEvent } from "most";
import express from "express";
import { Server as WebSocketServer } from "ws";

export function run(code, { port, verbose, spawn: spawnParams }) {
  if (spawnParams == null) {
    throw new TypeError("Missing a required param: spawnParams");
  }

  const server = createServer();
  const app = express();

  app.get("/", (_, res) => {
    res.send(`<!doctype html>
<html>
  <head>
    <title>stable</title>
  </head>
  <body>
    <!-- TODO: during bootstrapping, I'm hardcoding chai and sinon dependencies -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/chai/4.2.0/chai.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/sinon.js/7.2.2/sinon.js"></script>
    <script>
const sock = new WebSocket("ws://0.0.0.0:${port}/ws");
let ready = false;

sock.addEventListener('open', () => {
  ready = true;
}, { once: true });

async function stableRun(suite) {
  if (ready) {
    await streamReportsToMothership(suite);
    if (typeof __coverage__ !== 'undefined') {
      await sock.send(JSON.stringify({ __coverage__ }));
    }
    sock.close(1000);
  } else {
    sock.addEventListener('open', () => {
      stableRun(suite);
    });
  }
}

async function streamReportsToMothership(suite) {
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

function serializeReason(reason) {
  const seen = new Set();
  const memo = Object.create(null);

  for (const prop of ["name", "message", "stack", "code"]) {
    const candidate = reason[prop];

    if (candidate != null) {
      if (typeof candidate !== 'object') {
        memo[prop] = candidate;
      } else if (!seen.has(candidate)) {
        memo[prop] = candidate;
        seen.add(candidate);
      } else {
        memo[prop] = "[Circular]"; // Just scrub cycles for now
      }
    }
  }
  return memo;
}
    </script>
    <script src="./bundle.js"></script>
  </body>
</html>
`);
  });

  app.get("/bundle.js", (_, res) => {
    res.setHeader("Content-type", "text/javascript");
    res.send(code);
  });

  const wss = new WebSocketServer({ server });
  let browser;

  server.on("request", app);

  start();

  function start() {
    const url = `http://0.0.0.0:${port}`;

    server.listen(port, () => {
      if (verbose) {
        console.log(`server listening at ${url}`); // eslint-disable-line
      }
      const [proc, args] = spawnParams(url);

      browser = spawn(proc, args);
    });
  }

  function stop() {
    browser.kill();
    server.close();
  }

  return fromEvent("connection", wss)
    .take(1)
    .chain(([ws]) =>
      fromEvent("message", ws).takeUntil(fromEvent("close", ws).tap(stop)),
    )
    .map(({ data }: { data: string }) => data)
    .map(JSON.parse)
    .filter(({ __coverage__: coverage } = {}) => {
      if (coverage != null) {
        global["__coverage__"] = coverage;
        return false;
      }
      return true;
    });
}
