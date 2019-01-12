import { Listeners as ListenersInterface, Listener } from "./interfaces";

export class Listeners implements ListenersInterface {
  pending: Listener[];

  complete: Listener[];

  config: any;

  constructor({ pending = [], complete = [], config = {} } = {}) {
    this.pending = [].concat(pending);
    this.complete = [].concat(complete);
  }
}
