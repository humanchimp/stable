import { SelectionParams } from "../../interfaces";

export function parseSelectionParams(
  searchParams: URLSearchParams,
): SelectionParams {
  const grepPattern = searchParams.get("grep");
  const filter = searchParams.get("filter");

  return {
    grep: grepPattern && new RegExp(grepPattern),
    filter,
  };
}
