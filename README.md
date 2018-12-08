# stable

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

Or as a framework:
```javascript

describe("a feature", () => {
  it("works like a bdd framework!", () => {
    console.log("This is sort of like jasmine or mocha");
  })

  it("works well", () => {
    assert(true)
  })
})
```
(This part is not implemented yet. But it's planned)
