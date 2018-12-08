import { fromAsyncIterable } from 'most-async-iterable';
import { main } from './stable-test';

fromAsyncIterable(main.run())
  .filter(({ ok }) => !ok)
  .observe(console.log);
