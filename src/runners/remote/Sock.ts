/// <reference lib="dom" />
import { Message } from "../../types";

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

  console(method: string, rest: any[]): void {
    this.message({ console: { method, arguments: rest } });
  }

  close(code: any): Promise<Event> {
    return new Promise(resolve => {
      super.close(code);
      this.addEventListener("close", resolve, { once: true });
    });
  }
}
