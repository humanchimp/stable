import { Suite } from "../../../interfaces";

export const virtualMethods = [
  "assert",
  "clear",
  "log",
  "warn",
  "error",
  "count",
  "countReset",
  "debug",
  "dir",
  "dirxml",
  "exception",
  "group",
  "groupCollapsed",
  "groupEnd",
  "markTimeline",
  "profile",
  "profileEnd",
  "info",
  "table",
  "time",
  "timeEnd",
  "timeStamp",
  "timeline",
  "timelineEnd",
  "timeLog",
  "trace",
];

interface Sender {
  (...rest: any[]): void;
}

export function wrapConsole(baseConsole: Console, send: Sender) {
  return virtualMethods.reduce((memo, method) => {
    memo[method] = virtual(method);
    return memo;
  }, Object.create(baseConsole));

  function virtual(method) {
    return (...rest) => {
      try {
        send(method, rest);
      } catch (_) {
        // drop it while it's hawwwwwt
      }
    };
  }
}

export function setupVconsole(suite: Suite, send: Sender): Suite {
  let originalConsole;

  /* eslint-disable no-global-assign */
  return suite
    .beforeAll(() => {
      originalConsole = console;
      console = wrapConsole(originalConsole, send);
    })
    .afterAll(() => {
      console = originalConsole;
    });
  /* eslint-enable no-global-assign */
}

export class Vconsole implements Console {
  private backingConsole: Console;

  private listeners: Set<any>;

  get Console() {
    return this.backingConsole.Console;
  }

  get memory() {
    return this.backingConsole.memory;
  }

  log = (...rest) => {
    this.method("log", rest);
  };

  error = (...rest) => {
    this.method("error", rest);
  };

  warn = (...rest) => {
    this.method("warn", rest);
  };

  info = (...rest) => {
    this.method("info", rest);
  };

  assert = (...rest) => {
    this.method("assert", rest);
  };

  clear = (...rest) => {
    this.method("clear", rest);
  };

  count = (...rest) => {
    this.method("count", rest);
  };

  countReset = (...rest) => {
    this.method("countReset", rest);
  };

  debug = (...rest) => {
    this.method("debug", rest);
  };

  dir = (...rest) => {
    this.method("dir", rest);
  };

  dirxml = (...rest) => {
    this.method("dirxml", rest);
  };

  exception = (...rest) => {
    this.method("exception", rest);
  };

  group = (...rest) => {
    this.method("group", rest);
  };

  groupCollapsed = (...rest) => {
    this.method("groupCollapsed", rest);
  };

  groupEnd = (...rest) => {
    this.method("groupEnd", rest);
  };

  markTimeline = (...rest) => {
    this.method("markTimeline", rest);
  };

  profile = (...rest) => {
    this.method("profile", rest);
  };

  profileEnd = (...rest) => {
    this.method("profileEnd", rest);
  };

  table = (...rest) => {
    this.method("table", rest);
  };

  time = (...rest) => {
    this.method("time", rest);
  };

  timeLog = (...rest) => {
    this.method("timeLog", rest);
  };

  timeEnd = (...rest) => {
    this.method("timeEnd", rest);
  };

  timeStamp = (...rest) => {
    this.method("timeStamp", rest);
  };

  timeline = (...rest) => {
    this.method("timeline", rest);
  };

  timelineEnd = (...rest) => {
    this.method("timelineEnd", rest);
  };

  trace = (...rest) => {
    this.method("trace", rest);
  };

  constructor(backingConsole: Console) {
    this.backingConsole = backingConsole;
    this.listeners = new Set();
  }

  addListener(eventName, listener) {
    this.assertMessageEvent(eventName);
    this.listeners.add(listener);
  }

  removeListener(eventName, listener) {
    this.assertMessageEvent(eventName);
    this.listeners.delete(listener);
  }

  private method(methodName, args) {
    this.listeners.forEach(listener => {
      listener({ console: { method: methodName, arguments: args } });
    });
  }

  private assertMessageEvent(eventName) {
    if (eventName !== "message") {
      throw new Error(`unknown event name: ${eventName}`);
    }
  }
}
