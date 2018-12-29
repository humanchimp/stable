import { chai } from "./plugins/chai";
import { timing } from "./plugins/timing";
import { rescue } from "./plugins/rescue";
import { sinon } from "./plugins/sinon";
import { glob } from "./plugins/glob";
import { stable } from './plugins/stable';

export default {
  glob: "test/**-test.{ts,js}",
  plugins: [
    chai(),
    timing({
      timeout: 2000,
    }),
    rescue(),
    sinon(),
    glob(),
    stable(),
  ],
};
