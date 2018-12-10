# :horse: stable

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

## why another test framework?

Because this one is mine.

The real reason is that I wanted to play with async generators and this seemed like a good use case for them. But I like the result so far, and I want to build out my own framework as an experiment.

I got really excited about jest, but then it turned out to be way too opinionated and wasn't going to work well for my use cases, some of which involve needing to run tests in actual browsers, not just jsdom.

So I welcome the opportunity to have my own lattice to hang implements on—the ones that make my own peculiar tradeoffs.

## north star

It should be dead simple and self contained. It should be flexible and, failing that, hackable.

## goals

- [x] Suites (`describe`)
- [x] Specs (`it`)
- [x] Hooks (`{before,after}{Each,All}`)
- [x] Metadata (`info` annotations)
- [x] Focus in (`fdescribe`, `fit`)
- [x] Skip (`xdescribe`, `xit`)
- [x] Tables (`describeEach`, a nice innovation from jest)
- [x] Reporters
  - [x] tap / `console.{log,warn}` built in
  - [ ] others are possible
- [ ] Plays nice.
  - [x] Works in browsers
  - [x] Works in node
  - [ ] Works with karma
  - [ ] Works with testem
  - [ ] Works with jsdom
- [ ] Suite partitioning
  - [ ] Deep partitioning?
- [x] Suite randomization
  - [x] Deep randomization
- [x] Familiar BDD interface
- [ ] Minimal (zero?) fallout
- [ ] Fail-fast option?
- [x] [Simple interop with a streams library](streams.js)

## license

See [LICENSE](LICENSE)
