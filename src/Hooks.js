export class Hooks {
  constructor() {
    this.beforeAll = [];
    this.beforeEach = [];
    this.afterEach = [];
    this.afterAll = [];
  }

  *run(hookName) {
    for (const thunk of this[hookName]) {
      yield {
        name: hookName,
        thunk,
      };
    }
  }
}
