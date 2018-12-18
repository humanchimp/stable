const { assign } = Object;

export class Selection {
  constructor(options) {
    assign(this, options);
    this.predicate = this.predicate.bind(this);
    if (typeof this.grep === "string") {
      this.grep = new RegExp(this.grep); // no escaping
    }
  }

  predicate({ suite, spec }) {
    const candidate = suite.prefixed(spec.description);

    if (this.grep != null && !this.grep.test(candidate)) {
      return false;
    }
    if (this.filter != null && !candidate.includes(this.filter)) {
      return false;
    }
    return true;
  }
}
