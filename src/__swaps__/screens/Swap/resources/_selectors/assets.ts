import { ParsedAssetsDict, ParsedAssetsDictByChain, ParsedUserAsset, UniqueId } from '@/__swaps__/types/assets';
import { ChainId } from '@/__swaps__/types/chains';
import { deriveAddressAndChainWithUniqueId } from '@/__swaps__/utils/address';
import { add } from '@/__swaps__/utils/numbers';

// selectors
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

export function selectUserAssetsListByChainId(chainId: ChainId, assets: ParsedAssetsDictByChain) {
  const assetsForChain = assets?.[chainId];
  if (!assetsForChain) return [];
  return Object.values(assetsForChain).sort(
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

export function selectUserAssetsBalance(assets: ParsedAssetsDictByChain) {
  const networksTotalBalance = Object.values(assets).map(assetsOnject => {
    const assetsNetwork = Object.values(assetsOnject);
    const networkBalance = assetsNetwork
      .map(asset => asset.native.balance.amount)
      .reduce((prevBalance, currBalance) => add(prevBalance, currBalance), '0');
    return networkBalance;
  });
  const totalAssetsBalance = networksTotalBalance.reduce((prevBalance, currBalance) => add(prevBalance, currBalance), '0');
  return totalAssetsBalance;
}
