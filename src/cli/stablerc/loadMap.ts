import { StablercChainParams } from "../interfaces";
import glob from "fast-glob";
import { StablercChain } from "./StablercChain";
import { uniq } from "../uniq";

export async function loadMap(
  filename: string,
  params: StablercChainParams,
): Map<string, StablercChain> {
  const chains: Map<string, StablercChain> = await StablercChain.loadAll(
    filename,
    params,
  );
  const specs = uniq([...chains.values()].reduce(
    (memo, chain) => memo.concat(chain.flat().document.include),
    [],
  ));

  console.log(
    specs,
  );
}
