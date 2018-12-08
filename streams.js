import { fromAsyncIterable } from "most-async-iterable";
import { tap } from "./stable";
import { main } from "./stable-test";

const reports = fromAsyncIterable(tap(main)).multicast();

reports.filter(report => report.startsWith("ok")).observe(console.info);
reports.filter(report => report.startsWith("not ok")).observe(console.warn);
