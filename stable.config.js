import { timing } from "./plugins/timing";
import { rescue } from "./plugins/rescue";
import { fixture } from "./plugins/fixture";

export default {
  glob: "test/**-test.{ts,js}",
  plugins: [
    timing({
      timeout: 2000,
    }),
    rescue(),
    fixture({
      include: 'test/fixture/**',
    }),
  ],
};
