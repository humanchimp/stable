export class Listeners {
  constructor({ pending = [], complete = [] } = {}) {
    this.pending = [].concat(pending);
    this.complete = [].concat(complete);
  }
}
