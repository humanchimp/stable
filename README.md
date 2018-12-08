# :horse: stable

an experimental test framework built with async generators.

inspired by jasmine. bring your own assertion library.

## api

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

Build up suites using the fluent API. Maximal simplicity and flexibility at the cost of some boilerplate (extra leading dots; you have to call `run` yourself)

I will most likely implement a framework on top of the library. It would then allow you to write code that is virtually identical to jasmine or mocha or jest.

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
This part is not implemented yet. But it's planned. This is most likely how I will use this most of the time.

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
- [x] Metadata (`meta` and `url` annotations)
- [x] Focus in (`fdescribe`, `fit`)
- [x] Skip (`xdescribe`, `xit`)
- [x] Tables (`describeEach`, a nice innovation from jest)
- [ ] Reporters
  - [ ] tap / `console.{log,warn}` built in
  - [ ] others are possible
- [ ] Plays nice.
  - [x] Works in browsers
  - [ ] Works in node
  - [ ] Works with karma
  - [ ] Works with testem
  - [ ] Works with jsdom
- [ ] Suite partitioning
  - [ ] Deep partitioning?
- [x] Suite randomization
  - [x] Deep randomization
- [ ] Familiar BDD interface
- [ ] Minimal (zero?) fallout
- [ ] Fail-fast option?
- [x] [Simple interop with a streams library](streams.js)

## license

See [LICENSE](LICENSE)
