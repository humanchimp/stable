import { fromAsyncIterable } from "most-async-iterable";
import { reports } from "./src/stable";
import { main } from "./test/main-test";

const stream = fromAsyncIterable(reports(main)).multicast();

stream.filter(({ ok }) => ok).observe(console.info);
stream.filter(({ ok }) => !ok).observe(console.warn);
