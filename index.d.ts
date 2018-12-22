type ThunkResult = Promise<any> | void;

interface Thunk {
  (): ThunkResult;
}

interface TableThunk {
  (row: any): ThunkResult;
}

interface Hook {
  (hook: Thunk): void;
}

interface Suite {
  (description: string, closure: Thunk): void;
}

interface TableSuite {
  (description: string, table: any[], closure: TableThunk): void;
}

interface Spec {
  (description: string, closure: Thunk): void;
}

interface ShouldFail {
  (): void;
}

interface Rescuer {
  (reason: any): void;
}

interface Info {
  (content: any): void;
}

interface Timeout {
  (ms: number): void;
}

declare var beforeAll: Hook;
declare var beforeEach: Hook;
declare var afterAll: Hook;
declare var afterEach: Hook;
declare var describe: Suite;
declare var xdescribe: Suite;
declare var fdescribe: Suite;
declare var describeEach: TableSuite;
declare var xdescribeEach: TableSuite;
declare var fdescribeEach: TableSuite;
declare var it: Spec;
declare var xit: Spec;
declare var fit: Spec;
declare var shouldFail: ShouldFail;
declare var rescue: Rescuer;
declare var info: Info;
declare var timeout: Timeout;
