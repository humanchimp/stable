# :horse: stable

[![codecov](https://codecov.io/gh/humanchimp/stable/branch/master/graph/badge.svg?token=mYDCN5PRsc)](https://codecov.io/gh/humanchimp/stable)

`stable` is a BDD test framework for javascript and TypeScript. It's designed to be self contained and simple to use.

## installation

```bash
npm install @topl/stable --save-dev
```

Note: this currently doesn't work since the package is not published to npm at this time.

## usage

```json
// ...
"scripts": {
  "test": "stable"
},
```

## configuration

Optionally, you can control your configuration with finer grain by adding a `stable.config.js`. The schema of that file will need to be documented preparatory to releasing anything.

## some words for now

This is mostly placeholder, since I am probably waiting until right before I release to write docs.

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

## goals

- [ ] Inherits from your project's rollup config
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
    - [x] Runs in-process using `Function` 
    - [ ] Remote excution by default.
  - [x] Works in node
  - [ ] Works in deno
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
- stable was written in TypeScript (a superset of javascript) using some of javascript's newer features, notably ES Modules and asynchronous generators.
- you can pass stable, the library, into stable, the framework. To do so, you could use stable, the plugin. this is mostly useful for using stable to test stable. plugins are used in conjunction with `stable`, the cli.

## license

See [LICENSE](LICENSE)
