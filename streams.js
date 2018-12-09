import { fromAsyncIterable } from "most-async-iterable";
import { tap } from "./stable";
import { main } from "./stable-test";

const reports = fromAsyncIterable(main.reports()).multicast();

reports.filter(({ ok }) => ok).observe(console.info);
reports.filter(({ ok }) => !ok).observe(console.warn);
