import { Task } from "../interfaces";

export class PrintConfigTask implements Task {
  run() {
    console.log("here we show the config");
  }
}
