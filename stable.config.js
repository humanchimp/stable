import { chai } from "./plugins/chai";
import { timing } from "./plugins/timing";
import { rescue } from "./plugins/rescue";

export default {
  glob: "test/**-test.js",
  plugins: [
    chai(),
    timing({
      timeout: 2000,
    }),
    rescue(),
  ],
};
