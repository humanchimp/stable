const { assign } = Object;

export class Selection {
  constructor(options) {
    assign(this, options);
    if (typeof this.grep === "string") {
      this.grep = new RegExp(this.grep); // no escaping
    }
    this.predicate = this.predicate.bind(this);
  }

  partition(total, partition, partitions) {
    if (partition >= partitions) {
      throw new Error("partition must be less than partitions");
    }
    const sizes = Array(partitions).fill(0);
    for (let i = 0; i < total; i++) {
      sizes[i % partitions]++;
    }
    const start = sizes.slice(0, partition).reduce((memo, size) => memo + size, 0);
    const end = start + sizes[partition];

    return spec => {
      const { series: current } = spec;

      if ((current < start) || current >= end) {
        return false;
      }
      return this.predicate(spec);
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
