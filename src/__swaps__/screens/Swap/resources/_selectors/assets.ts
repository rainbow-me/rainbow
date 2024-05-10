import { ParsedAssetsDict, ParsedAssetsDictByChain, ParsedUserAsset, UniqueId } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { deriveAddressAndChainWithUniqueId } from '@/__swaps__/utils/address';
import { add } from '@/__swaps__/utils/numbers';

// selectors
export function selectorFilterByUserChains<T>({
  data,
  selector,
}: {
  data: ParsedAssetsDictByChain;
  selector: (data: ParsedAssetsDictByChain) => T;
}): T {
  const filteredAssetsDictByChain = Object.keys(data).reduce((acc, key) => {
    const chainKey = Number(key);
    acc[chainKey] = data[chainKey];
    return acc;
  }, {} as ParsedAssetsDictByChain);
  return selector(filteredAssetsDictByChain);
}

export function selectUserAssetsList(assets: ParsedAssetsDictByChain) {
  return Object.values(assets)
    .map(chainAssets => Object.values(chainAssets))
    .flat()
    .sort((a: ParsedUserAsset, b: ParsedUserAsset) => parseFloat(b?.native?.balance?.amount) - parseFloat(a?.native?.balance?.amount));
}

export function selectUserAssetsFilteringSmallBalancesList(assets: ParsedAssetsDictByChain) {
  return selectUserAssetsList(assets).filter(a => !a.smallBalance);
}

export function selectUserAssetsDictByChain(assets: ParsedAssetsDictByChain) {
  return assets;
}

export function selectUserAssetsListByChainId(assets: ParsedAssetsDictByChain, chainId: ChainId) {
  const assetsForNetwork = assets?.[chainId];

  return Object.values(assetsForNetwork).sort(
    (a: ParsedUserAsset, b: ParsedUserAsset) => parseFloat(b?.native?.balance?.amount) - parseFloat(a?.native?.balance?.amount)
  );
}

export function selectUserAssetAddressMapByChainId(assets: ParsedAssetsDictByChain) {
  const mapAddresses = (list: ParsedAssetsDict = {}) => Object.values(list).map(i => i.address);
  return {
    [ChainId.mainnet]: mapAddresses(assets[ChainId.mainnet]) || [],
    [ChainId.optimism]: mapAddresses(assets[ChainId.optimism]) || [],
    [ChainId.bsc]: mapAddresses(assets[ChainId.bsc]) || [],
    [ChainId.polygon]: mapAddresses(assets[ChainId.polygon]) || [],
    [ChainId.arbitrum]: mapAddresses(assets[ChainId.arbitrum]) || [],
    [ChainId.base]: mapAddresses(assets[ChainId.base]) || [],
    [ChainId.zora]: mapAddresses(assets[ChainId.zora]) || [],
    [ChainId.avalanche]: mapAddresses(assets[ChainId.avalanche]) || [],
  };
}

// selector generators
export function selectUserAssetWithUniqueId(uniqueId: UniqueId) {
  return (assets: ParsedAssetsDictByChain) => {
    const { chain } = deriveAddressAndChainWithUniqueId(uniqueId);
    return assets?.[chain]?.[uniqueId];
  };
}

export function selectUserAssetsBalance(assets: ParsedAssetsDictByChain, hidden: (asset: ParsedUserAsset) => boolean) {
  const networksTotalBalance = Object.values(assets).map(assetsOnject => {
    const assetsNetwork = Object.values(assetsOnject);

    const networkBalance = assetsNetwork
      .filter(asset => !hidden(asset))
      .map(asset => asset.native.balance.amount)
      .reduce((prevBalance, currBalance) => add(prevBalance, currBalance), '0');
    return networkBalance;
  });
  const totalAssetsBalance = networksTotalBalance.reduce((prevBalance, currBalance) => add(prevBalance, currBalance), '0');
  return totalAssetsBalance;
}
