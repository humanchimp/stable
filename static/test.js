
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
(function () {
  'use strict';

  function _asyncIterator(iterable) {
    var method;

    if (typeof Symbol === "function") {
      if (Symbol.asyncIterator) {
        method = iterable[Symbol.asyncIterator];
        if (method != null) return method.call(iterable);
      }

      if (Symbol.iterator) {
        method = iterable[Symbol.iterator];
        if (method != null) return method.call(iterable);
      }
    }

    throw new TypeError("Object is not async iterable");
  }

  function _AwaitValue(value) {
    this.wrapped = value;
  }

  function _AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;
        var wrappedAwait = value instanceof _AwaitValue;
        Promise.resolve(wrappedAwait ? value.wrapped : value).then(function (arg) {
          if (wrappedAwait) {
            resume("next", arg);
            return;
          }

          settle(result.done ? "return" : "normal", arg);
        }, function (err) {
          resume("throw", err);
        });
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    _AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  _AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  _AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  _AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  function _wrapAsyncGenerator(fn) {
    return function () {
      return new _AsyncGenerator(fn.apply(this, arguments));
    };
  }

  function _awaitAsyncGenerator(value) {
    return new _AwaitValue(value);
  }

  function _asyncGeneratorDelegate(inner, awaitWrap) {
    var iter = {},
        waiting = false;

    function pump(key, value) {
      waiting = true;
      value = new Promise(function (resolve) {
        resolve(inner[key](value));
      });
      return {
        done: false,
        value: awaitWrap(value)
      };
    }

    if (typeof Symbol === "function" && Symbol.iterator) {
      iter[Symbol.iterator] = function () {
        return this;
      };
    }

    iter.next = function (value) {
      if (waiting) {
        waiting = false;
        return value;
      }

      return pump("next", value);
    };

    if (typeof inner.throw === "function") {
      iter.throw = function (value) {
        if (waiting) {
          waiting = false;
          throw value;
        }

        return pump("throw", value);
      };
    }

    if (typeof inner.return === "function") {
      iter.return = function (value) {
        return pump("return", value);
      };
    }

    return iter;
  }

  function describe(description, closure) {
    const suite = new Suite(description);

    if (closure != null) {
      closure(suite);
    }

    return suite;
  }

  class Hooks {
    constructor() {
      this.beforeAll = [];
      this.beforeEach = [];
      this.afterEach = [];
      this.afterAll = [];
    }

  }

  class Suite {
    constructor(description, parent) {
      this.description = description;
      this.parent = parent;
      this.hooks = new Hooks();
      this.specs = [];
      this.suites = [];
      this.focused = false;
    }

    beforeAll(hook) {
      this.hooks.beforeAll.push(hook);
      return this;
    }

    afterAll(hook) {
      this.hooks.afterAll.push(hook);
      return this;
    }

    beforeEach(hook) {
      this.hooks.beforeEach.push(hook);
      return this;
    }

    afterEach(hook) {
      this.hooks.afterEach.push(hook);
      return this;
    }

    fit(description, test) {
      this.focused = true;
      this.specs.push({
        description,
        test,
        focused: true
      });
    }

    xit(description, test) {
      this.specs.push({
        description,
        test,
        skipped: true
      });
    }

    it(description, test) {
      this.specs.push({
        description,
        test
      });
      return this;
    }

    describe(description, closure) {
      {
        const {
          length
        } = arguments;

        if (length !== 2) {
          throw new TypeError(`Expected 2 arguments. Got ${length}`);
        }
      }
      const suite = new Suite(description, this);
      closure(suite);
      this.suites.push(suite);
      return this;
    }

    hookify(queue, callback) {
      var _this = this;

      return _wrapAsyncGenerator(function* () {
        yield* _asyncGeneratorDelegate(_asyncIterator((yield _awaitAsyncGenerator(_this.runHooks("beforeAll", _this)))), _awaitAsyncGenerator);
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;

        var _iteratorError;

        try {
          for (var _iterator = _asyncIterator(queue), _step, _value; _step = yield _awaitAsyncGenerator(_iterator.next()), _iteratorNormalCompletion = _step.done, _value = yield _awaitAsyncGenerator(_step.value), !_iteratorNormalCompletion; _iteratorNormalCompletion = true) {
            const item = _value;
            yield* _asyncGeneratorDelegate(_asyncIterator((yield _awaitAsyncGenerator(_this.runHooks("beforeEach", item)))), _awaitAsyncGenerator);
            yield* _asyncGeneratorDelegate(_asyncIterator(callback(item)), _awaitAsyncGenerator);
            yield* _asyncGeneratorDelegate(_asyncIterator((yield _awaitAsyncGenerator(_this.runHooks("afterEach", item)))), _awaitAsyncGenerator);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return != null) {
              yield _awaitAsyncGenerator(_iterator.return());
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }

        yield* _asyncGeneratorDelegate(_asyncIterator((yield _awaitAsyncGenerator(_this.runHooks("afterAll", _this)))), _awaitAsyncGenerator);
      })();
    }

    run() {
      var _this2 = this;

      return _wrapAsyncGenerator(function* () {
        yield* _asyncGeneratorDelegate(_asyncIterator((yield _awaitAsyncGenerator(_this2.hookify(_this2.specs, function* (spec) {
          yield this.runSpec(spec);
        }.bind(_this2))))), _awaitAsyncGenerator);
        yield* _asyncGeneratorDelegate(_asyncIterator((yield _awaitAsyncGenerator(_this2.hookify(_this2.suites,
        /*#__PURE__*/
        function () {
          var _ref = _wrapAsyncGenerator(function* (suite) {
            yield* _asyncGeneratorDelegate(_asyncIterator((yield _awaitAsyncGenerator(suite.run()))), _awaitAsyncGenerator);
          });

          return function (_x) {
            return _ref.apply(this, arguments);
          };
        }())))), _awaitAsyncGenerator);
      })();
    }

    tap() {
      var _this3 = this;

      return _wrapAsyncGenerator(function* () {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;

        var _iteratorError2;

        try {
          for (var _iterator2 = _asyncIterator(_this3.run()), _step2, _value2; _step2 = yield _awaitAsyncGenerator(_iterator2.next()), _iteratorNormalCompletion2 = _step2.done, _value2 = yield _awaitAsyncGenerator(_step2.value), !_iteratorNormalCompletion2; _iteratorNormalCompletion2 = true) {
            const {
              ok,
              description,
              reason
            } = _value2;
            yield `${ok ? "" : "not "}ok ${description}${formatReason(reason)}`;
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
              yield _awaitAsyncGenerator(_iterator2.return());
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      })();
    }

    async runSpec({
      description,
      test,
      focused,
      skipped
    }) {
      description = prefixed(this, description);

      if (skipped || this.focused && !focused) {
        return {
          description,
          ok: true,
          skipped: true
        };
      }

      const reason = await runTest(test);
      return {
        description,
        reason,
        ok: !reason
      };
    }

    runHooks(hookName, item) {
      var _this4 = this;

      return _wrapAsyncGenerator(function* () {
        const {
          description
        } = item;

        for (const hook of _this4.hooks[hookName]) {
          const reason = yield _awaitAsyncGenerator(runTest(hook));

          if (reason) {
            yield {
              reason,
              description: `${hookName}: ${description}`,
              ok: false
            };
          }
        }
      })();
    }

  }

  async function runTest(test) {
    try {
      await test();
    } catch (reason) {
      return reason;
    }
  }

  function prefixed(node, description) {
    const segments = [];

    do {
      segments.unshift(node.description);
    } while (node = node.parent);

    return [...segments, description].join(" ");
  }

  function formatReason(reason) {
    if (!reason) {
      return "";
    }

    return `
${reason.stack.split("\n").map(line => `# ${line}`).join("\n")}
`;
  }

  const suites = [describe("describe", suite => {
    let subject;
    return suite.beforeEach(() => {
      subject = describe("subject");
    }).it("should have an `it` method", () => {
      assert(typeof subject.it === "function");
    }).it("should have an `run` method", () => {
      assert(typeof subject.run === "function");
    }).it("should have a `tap` method", () => {
      assert(typeof subject.tap === "function");
    }).describe("Suite#it", suite => suite.it("should enqueue a spec", () => {
      assert(subject.specs.length === 0);
      subject.it("it", () => {});
      assert(subject.specs.length === 1);
    })).describe("Suite#run", suite => suite.beforeEach(() => {
      subject.it("a", () => {}).it("b", () => {});
    }).it("asynchronously yields reports", async () => {
      const reports = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;

      var _iteratorError;

      try {
        for (var _iterator = _asyncIterator(subject.run()), _step, _value; _step = await _iterator.next(), _iteratorNormalCompletion = _step.done, _value = await _step.value, !_iteratorNormalCompletion; _iteratorNormalCompletion = true) {
          const report = _value;
          reports.push(report);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            await _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      console.log(reports);
    })).describe("Suite#tap", suite => {});
  })];

  async function main() {
    for (const suite of shuffle(suites.slice())) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;

      var _iteratorError2;

      try {
        for (var _iterator2 = _asyncIterator(suite.tap()), _step2, _value2; _step2 = await _iterator2.next(), _iteratorNormalCompletion2 = _step2.done, _value2 = await _step2.value, !_iteratorNormalCompletion2; _iteratorNormalCompletion2 = true) {
          const result = _value2;
          console.log(result);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
            await _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
  }

  main();

  function assert(condition) {
    if (!condition) {
      throw new Error("Assertion error");
    }
  }

  function shuffle(array) {
    var m = array.length,
        t,
        i; // While there remain elements to shuffle…

    while (m) {
      // Pick a remaining element…
      i = Math.floor(Math.random() * m--); // And swap it with the current element.

      t = array[m];
      array[m] = array[i];
      array[i] = t;
    }

    return array;
  }

}());
