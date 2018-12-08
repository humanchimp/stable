import { fromAsyncIterable } from 'most-async-iterable';
import { main } from './stable-test';

const reports = fromAsyncIterable(main.tap()).multicast();

reports.filter(report => report.startsWith('ok')).observe(console.info);
reports.filter(report => report.startsWith('not ok')).observe(console.warn);
