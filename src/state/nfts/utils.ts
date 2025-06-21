export const replaceEthereumWithMainnet = (network: string | undefined) => {
  if (!network) return undefined;

  if (network === 'ethereum') {
    return 'mainnet';
  }
  return network;
};

export const mergeMaps = <T>(map1: Map<string, T>, map2: Map<string, T>) => {
  return new Map(
    (function* () {
      yield* map1;
      yield* map2;
    })()
  );
};
