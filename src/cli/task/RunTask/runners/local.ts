import { Suite, RunTaskParams } from "../../../../interfaces";
import { of, Stream, fromEvent } from "most";
import { fromAsyncIterable } from "most-async-iterable";
import { runSuite } from "../runSuite";
import { Vconsole } from "../Vconsole";
import { Message } from "../../../../types";
import { EndSignal } from "../EndSignal";
import { Selection } from "../../../../framework/lib";
import { CliArgKey } from "../../../../enums";
import { implForSort } from "../implForSort";
import { defaultValueForOption } from "../../../defaultValueForOption";

export function run(
  thunk,
  {
    [CliArgKey.FILTER]: filter,
    [CliArgKey.GREP]: grep,
    [CliArgKey.SORT]: sort,
    [CliArgKey.FAIL_FAST]: failFast,
  }: RunTaskParams,
): Stream<Message> {
  const selection = new Selection({
    filter,
    grep: grep && new RegExp(grep),
  });
  const sorter = implForSort(sort);
  const vconsole = new Vconsole(console);

  return of(thunk(vconsole))
    .await()
    .chain((suite: Suite) => {
      const end = new EndSignal();
      const reports = (fromAsyncIterable(
        runSuite(
          suite,
          selection,
          sorter,
          defaultValueForOption(CliArgKey.FAIL_FAST, failFast),
        ),
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
