# stable

an experimental test framework built with async generators.

inspired by jasmine.

## api

```javascript
import { describe, run } from 'stable'

run([
  describe("a feature")
    .it("works!", () => { console.log("Golly!"); })
    .it("works well", () => {
      throw new Error("this feature doesn't work well")
    })
])

```
