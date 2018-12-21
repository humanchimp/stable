import { partitionRangeForTotal } from "./partititionRangeForTotal";

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
      throw new RangeError("partition must be less than partitions");
    }
    const { start, end } = partitionRangeForTotal(total, partition, partitions);

    return spec => {
      const { series: current } = spec;

      if (current < start || current >= end) {
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
