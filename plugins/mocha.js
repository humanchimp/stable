export function mocha() {
  return {
    prelude: `
// Quick and dirty mapping of the stable api to the mocha api
describe.skip = xdescribe;
describeEach.skip = xdescribeEach;
it.skip = xit;
describe.only = fdescribe;
describeEach.only = fdescribeEach;
it.only = fit;
var before = beforeAll;
var after = afterAll;
`
  }
}