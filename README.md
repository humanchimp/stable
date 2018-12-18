# :horse: stable

[![codecov](https://codecov.io/gh/humanchimp/stable/branch/master/graph/badge.svg?token=mYDCN5PRsc)](https://codecov.io/gh/humanchimp/stable)

an experimental test framework built with async generators.

inspired by jasmine, mocha and jest. bring your own assertion library.

## api

You can use it as a framework:

```javascript
describe("a feature", () => {
  it("works like a bdd framework!", () => {
    console.log("This is sort of like jasmine or mocha");
  })

  it("is time-tested", () => {
    assert(true)
  })
})
```
_Figure 1_: It works pretty similarly to other BDD frameworks like jasmine or mocha or jest.

You can use it as a library:
```javascript
import { describe, run } from 'stable'

run([
  describe("a feature")
    .it("works!", () => { console.log("Golly!"); })
    .it("is bug-free", () => {
      assert(true)
    })
])
```
_Figure 2_: In this example, `describe` is a factory method which is the entry point to the `Suite` class' cascading (sometimes called "fluent") builder api. You can build up arbitrary test suites using this API. It takes a bit of getting used to but all features are supported (the framework derives all of its capabilities from this API).

## north star

It should be dead simple and self contained. It should be flexible and, failing that, hackable.

## secondary design criteria

When not in conflict with the overriding goal of simplicity, there are some intentional design ideas influencing the software implementation.

### no `this`

An unwanted feature of jasmine and mocha *which is intentionally omitted* is the sharing of properties/"variables" using `this`.

It offers no advantages over using lexical variables. Lexical bindings are better for being statically validated (for instance, typos are not "tolerated" the way they might be if you used properities).

Lexical bindings are easier to type if you're using TypeScript. If you want to use properties, you'd need to type the entire object, which is more cumbersome.

They are left out, following the principle that there is no need for competing features to do the same thing (this is known as being "opinionated").

## goals

- [x] Suites (`describe`)
  - [x] Async describe (pairs nicely with `describeEach`)
- [x] Specs (`it`)
- [x] Hooks (`{before,after}{Each,All}`)
- [x] Metadata (`info` annotations)
- [x] Focus in (`fdescribe`, `fit`)
- [x] Skip (`xdescribe`, `xit`)
- [x] Tables (`describeEach`, a nice innovation from jest)
- [x] Just-works coverage reporting via nyc
- [x] Reporters
  - [x] tap / `console.{log,warn}` built in
  - [ ] others are possible
- [ ] Plays nice.
  - [x] Works in browsers
  - [x] Works in node
  - [ ] Works in deno
  - [ ] Works with karma
  - [ ] Works with testem
  - [ ] Works with jsdom
- [x] Suite partitioning
  - [x] Deep partitioning
- [x] Suite randomization
  - [x] Deep randomization
- [x] Familiar BDD interface
- [ ] Minimal (zero?) fallout
- [ ] Fail-fast option?
- [x] [Simple interop with a streams library](examples/streams.js)

## trivia

- you can pass stable, the library, into stable, the framework. To do so, you could use stable, the plugin. this is mostly useful for using stable to test stable. plugins are used in conjunction with `stable`, the cli.

## license

See [LICENSE](LICENSE)
