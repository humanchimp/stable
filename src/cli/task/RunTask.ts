import { Task } from "../interfaces";

export class RunTask implements Task {
  run() {
    console.log("here we run");
  }
}
