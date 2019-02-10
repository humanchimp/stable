import { StablercChainParams } from "../interfaces";
import { StablercChain } from "./StablercChain";
import { StablercFile } from "./StablercFile";

export function loadStablercMap(
  chains: Map<string, StablercChain>,
): Map<string, StablercFile> {
  return new Map(
    [...chains.entries()].map(
      ([filename, chain]) => [filename, chain.flat()] as [string, StablercFile],
    ),
  );
}
