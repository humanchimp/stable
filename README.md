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

In no particular order:

* I wanted to play with async generators and this seemed like a good use case for them.
* I want to build out my own framework as an experiment.
* I got really excited about jest, but then it turned out to be way too opinionated in certain ways I disagreed with, and it wasn't going to work well for my use cases, some of which involve needing to run tests in actual browsers, not just jsdom.
* I welcome the opportunity to have my own lattice to hang implements on—the ones that make my own peculiar tradeoffs.
* I want a test framework more modern than mocha to replace mocha in some of the projects I'm working on. Likewise for jasmine. So familiarity is important so that I can hopefully do a mostly mechanical port when the time comes to do that.

The theme is overwhelming me-oriented. Sorry about that. This is one of my weekend projects.

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
  - [ ] Works in deno
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
- [x] [Simple interop with a streams library](examples/streams.js)

## license

See [LICENSE](LICENSE)
