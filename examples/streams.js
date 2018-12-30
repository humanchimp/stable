import { fromAsyncIterable } from "most-async-iterable";
import { coreSuite } from "./stable-builder-test";

const stream = fromAsyncIterable(coreSuite.reports()).multicast();

// You can apply arbitrary transformations over the streams...

stream.filter(({ ok }) => ok).observe(console.info);
stream.filter(({ ok }) => !ok).observe(console.warn);
