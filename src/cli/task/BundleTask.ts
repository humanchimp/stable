import { Task } from "../interfaces";

export class BundleTask implements Task {
  run() {
    console.log("here we create a bundle");
  }
}
