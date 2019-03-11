import { shuffle } from "../../../framework/shuffle";
import { Sorter } from "../../../interfaces";

export function implForSort(sort: string): Sorter {
  switch (sort) {
    case "shuffle":
      return shuffle;
  }
  return it => it;
}
