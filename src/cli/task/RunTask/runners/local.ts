import { Suite } from "../../../../interfaces";
import { of, Stream, fromEvent } from "most";
import { fromAsyncIterable } from "most-async-iterable";
import { skipped } from "../skipped";
import { implForSort } from "../implForSort";
import { Selection } from "../../../../framework/Selection";
import { Vconsole } from "../Vconsole";
import { Message } from "../../../../types";
import { EndSignal } from "../EndSignal";

export function run(thunk, { sort, filter, grep }): Stream<Message> {
  const selection = new Selection({
    filter,
    grep: grep && new RegExp(grep),
  });
  let hideSkips: boolean | "focus";

  const vconsole = new Vconsole(console);

  return of(thunk(vconsole))
    .await()
    .chain((suite: Suite) => {
      const end = new EndSignal();
      const reports = (fromAsyncIterable(
        suite.run(implForSort(sort), selection.predicate),
      ) as Stream<Message | EndSignal>)
        .continueWith(() => of(end))
        .multicast();

      return reports
        .filter(it => it !== end)
        .merge(
          fromEvent<Message>("message", vconsole).takeUntil(
            reports.filter(it => it === end),
          ),
        )
        .map(report => ({ ...report, suite })) as Stream<Message>;
    });
}
