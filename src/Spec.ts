import {
  Spec as SpecInterface,
  SpecMeta,
  ErrorHandler,
  Effect,
  SpecParams,
} from "./interfaces";

const { assign } = Object;

export class Spec implements SpecInterface {
  description: string;

  test: Effect;

  focused: boolean;

  skipped: boolean;

  meta: SpecMeta = {};

  constructor(params: SpecParams) {
    assign(this, params);
  }

  timeout(ms: number): Spec {
    this.meta.timeout = ms;
    return this;
  }

  shouldFail(): Spec {
    this.meta.shouldFail = true;
    return this;
  }

  rescue(rescuer: ErrorHandler): Spec {
    this.meta.rescuer = rescuer;
    return this;
  }
}
