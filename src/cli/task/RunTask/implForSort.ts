import { shuffle } from "../../../framework/shuffle";

export function implForSort(sort: string): any {
  switch (sort) {
    case "shuffle":
      return shuffle;
  }
  return it => it;
}
