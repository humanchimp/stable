import { StablercChainParams } from "../interfaces";
import { StablercChain } from "./StablercChain";
import { StablercFile } from "./StablercFile";

export async function loadStablercMap(
  filename: string,
  params: StablercChainParams,
): Promise<Map<string, StablercFile>> {
  const chains = await StablercChain.loadAll(filename, params);
  return new Map(
    [...chains.entries()].map(
      ([filename, chain]) => [filename, chain.flat()] as [string, StablercFile],
    ),
  );
}
