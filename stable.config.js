import { chai } from "./plugins/chai";
import { timing } from "./plugins/timing";

export default {
  glob: "test/**-test.js",
  plugins: [
    chai(),
    timing({
      timeout: 2000,
    }),
  ],
};
