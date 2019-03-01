import {
  Spec as SpecInterface,
  SpecMeta,
  ErrorHandler,
  Effect,
  SpecParams,
} from "../interfaces";

export class Spec implements SpecInterface {
  description: string;

  test: Effect;

  focused: boolean;

  skipped: boolean;

  meta: SpecMeta = {};

  constructor({
    description,
    test,
    focused = false,
    skipped = false,
  }: SpecParams) {
    this.description = description;
    this.test = test;
    this.focused = focused;
    this.skipped = skipped;
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
