import { fromAsyncIterable } from "most-async-iterable";
import { reports } from "../src/stable";
import { iocSuite } from "../test/ioc-test";
import { coreSuite } from "../test/stable-test";

const stream = fromAsyncIterable(reports([iocSuite, coreSuite])).multicast();

stream.filter(({ ok }) => ok).observe(console.info);
stream.filter(({ ok }) => !ok).observe(console.warn);
