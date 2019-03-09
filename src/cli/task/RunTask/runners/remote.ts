import { spawn } from "child_process";
import { createServer } from "http";
import { fromEvent } from "most";
import express from "express";
import { Server as WebSocketServer, WebSocket } from "ws";

interface WebSocketMessage {
  data: string;
}

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

  return fromEvent<[WebSocket]>("connection", wss)
    .take(1)
    .chain(([ws]: [WebSocket]) =>
      fromEvent<WebSocketMessage>("message", ws).takeUntil(
        fromEvent("close", ws).tap(stop),
      ),
    )
    .map(({ data }: WebSocketMessage) => data)
    .map(JSON.parse)
    .filter(payload => {
      if ("message" in payload) {
        const { __coverage__: coverage } = payload.message;

        if (coverage != null) {
          global["__coverage__"] = coverage;
          return false;
        }
      }
      return true;
    })
    .map(it => it.message);
}
