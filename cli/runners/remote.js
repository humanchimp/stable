const { of, fromEvent } = require("most");
const { spawn } = require("child_process");
const { createServer } = require("http");
const express = require("express");
const { Server: WebSocketServer } = require("ws");

exports.run = function run(code, { port, verbose }) {
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
const sock = new WebSocket("ws://localhost:${port}/ws");
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
    const url = `http://localhost:${port}`;

    server.listen(port, () => {
      if (verbose) {
        console.log(`server listening at ${url}`);
      }
      browser = spawn(
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        ["--headless", "--remote-debugging-port=9222", url],
      );
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
    .map(message => message.data)
    .map(JSON.parse)
    .filter(({ __coverage__: coverage } = {}) => {
      if (coverage != null) {
        global.__coverage__ = coverage;
        return false;
      }
      return true;
    });
};
