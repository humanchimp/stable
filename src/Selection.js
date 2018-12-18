const { assign } = Object;

export class Selection {
  constructor(options) {
    assign(this, options);
    this.predicate = this.predicate.bind(this);
    if (typeof this.grep === "string") {
      this.grep = new RegExp(this.grep); // no escaping
    }
  }

  partition(total, partition, partitions) {
    const size = Math.floor(total / partitions);
    const remainder = total % partitions;
    let start = size * partition;
    let end = start + size;

    if (partition === 0) {
      end += remainder;
    } else {
      start += remainder;
    }
    return spec => {
      const { series: current } = spec;

      if ((start > current) || (current >= end)) {
        return false;
      }
      return this.predicate(spec)
    };
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
