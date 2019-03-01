/// <reference lib="dom" />
import { Plan, Report, Summary } from "../../framework/interfaces";

interface CoverageMessage {
  __coverage__: any;
}

type Message = Plan | Report | Summary | CoverageMessage;

export class Sock extends WebSocket {
  opened: Promise<Event>;

  constructor(url: string) {
    super(url);
    this.opened = new Promise(resolve => {
      this.addEventListener("open", resolve, { once: true });
    });
  }

  message(message: Message): void {
    super.send(JSON.stringify({ message }));
  }

  close(code: any): Promise<Event> {
    return new Promise(resolve => {
      super.close(code);
      this.addEventListener("close", resolve, { once: true });
    });
  }
}
