import { Listeners as ListenersInterface, Listener } from "./interfaces";

export class Listeners implements ListenersInterface {
  pending: Listener[];

  complete: Listener[];

  constructor({ pending = [], complete = [] } = {}) {
    this.pending = [].concat(pending);
    this.complete = [].concat(complete);
  }
}
