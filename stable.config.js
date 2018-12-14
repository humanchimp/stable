import { chai } from "./plugins/chai";
import { timing } from "./plugins/timing";
import { rescue } from "./plugins/rescue";
import { objectContaining } from "./plugins/objectContaining";
import { sinon } from "./plugins/sinon";

export default {
  glob: "test/**-test.js",
  plugins: [
    chai(),
    timing({
      timeout: 2000,
    }),
    rescue(),
    objectContaining(),
    sinon(),
  ],
};
