import { fromAsyncIterable } from "most-async-iterable";
import { reports } from "./stable";
import { main } from "./main-test";

const stream = fromAsyncIterable(reports(main)).multicast();

stream.filter(({ ok }) => ok).observe(console.info);
stream.filter(({ ok }) => !ok).observe(console.warn);
