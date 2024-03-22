import { useCallback, useMemo, useState } from 'react';
import { Hex } from 'viem';

import { selectUserAssetsList, selectUserAssetsListByChainId } from '../resources/_selectors/assets';

import { useUserAssets, useAssets } from '@/__swaps__/screens/Swap/resources/assets';
import { ParsedAsset, ParsedAssetsDictByChain, ParsedSearchAsset } from '@/__swaps__/screens/Swap/types/assets';
import { ChainId } from '@/__swaps__/screens/Swap/types/chains';
import { SearchAsset } from '@/__swaps__/screens/Swap/types/search';
import { parseSearchAsset } from '@/__swaps__/screens/Swap/utils/assets';
import { isLowerCaseMatch } from '@/__swaps__/screens/Swap/utils/strings';
import type { SortMethod } from '@/__swaps__/screens/Swap/types/swap';
import { useDebounce } from '@/__swaps__/screens/Swap/hooks/useDebounce';
import { usePrevious } from '@/__swaps__/screens/Swap/hooks/usePrevious';
import { useSearchCurrencyLists } from './useSearchCurrencyLists';
import { useAccountSettings } from '@/hooks';

const sortBy = (by: SortMethod) => {
  switch (by) {
    case 'token':
      return selectUserAssetsList;
    case 'chain':
      return selectUserAssetsListByChainId;
  }
};

export const isSameAsset = (a1: Pick<ParsedAsset, 'chainId' | 'address'>, a2: Pick<ParsedAsset, 'chainId' | 'address'>) =>
  +a1.chainId === +a2.chainId && isLowerCaseMatch(a1.address, a2.address);

const isSameAssetInDiffChains = (a1?: Pick<ParsedAsset, 'address' | 'networks'> | null, a2?: Pick<ParsedAsset, 'address'> | null) => {
  if (!a1?.networks || !a2) return false;
  return Object.values(a1.networks).some(assetInNetwork => assetInNetwork?.address === a2.address);
};

export const useSwapAssets = ({ bridge }: { bridge: boolean }) => {
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();

  const [assetToSell, setAssetToSellState] = useState<ParsedSearchAsset | SearchAsset | null>(null);
  const [assetToBuy, setAssetToBuyState] = useState<ParsedSearchAsset | SearchAsset | null>(null);

  const prevAssetToSell = usePrevious<ParsedSearchAsset | SearchAsset | null>(assetToSell);

  const [outputChainId, setOutputChainId] = useState(ChainId.mainnet);

  const [sortMethod, setSortMethod] = useState<SortMethod>('token');

  const [assetToSellFilter, setAssetToSellFilter] = useState('');
  const [assetToBuyFilter, setAssetToBuyFilter] = useState('');

  const debouncedAssetToSellFilter = useDebounce(assetToSellFilter, 200);
  const debouncedAssetToBuyFilter = useDebounce(assetToBuyFilter, 200);

  const { data: userAssets = [] } = useUserAssets(
    {
      address: currentAddress as Hex,
      currency: currentCurrency,
    },
    {
      select: data => {
        const filteredAssetsDictByChain = Object.keys(data).reduce((acc, key) => {
          const chainKey = Number(key);
          acc[chainKey] = data[chainKey];
          return acc;
        }, {} as ParsedAssetsDictByChain);
        return sortBy(sortMethod)(filteredAssetsDictByChain);
      },
    }
  );

  console.log('userAssets', userAssets);

  const filteredAssetsToSell = useMemo(() => {
    return debouncedAssetToSellFilter
      ? userAssets.filter(({ name, symbol, address }) =>
          [name, symbol, address].reduce(
            (res, param) => res || param.toLowerCase().startsWith(debouncedAssetToSellFilter.toLowerCase()),
            false
          )
        )
      : userAssets;
  }, [debouncedAssetToSellFilter, userAssets]) as ParsedSearchAsset[];

  const { results: searchAssetsToBuySections } = useSearchCurrencyLists({
    inputChainId: assetToSell?.chainId,
    outputChainId,
    assetToSell,
    searchQuery: debouncedAssetToBuyFilter,
    bridge,
  });

  const { data: buyPriceData = [] } = useAssets({
    assetAddresses: assetToBuy ? [assetToBuy?.address] : [],
    chainId: outputChainId,
    currency: currentCurrency,
  });

  const { data: sellPriceData = [] } = useAssets({
    assetAddresses: assetToSell ? [assetToSell?.address] : [],
    chainId: outputChainId,
    currency: currentCurrency,
  });

  const assetToBuyWithPrice = useMemo(
    () => Object.values(buyPriceData || {})?.find(asset => asset.uniqueId === assetToBuy?.uniqueId),
    [assetToBuy, buyPriceData]
  );

  const assetToSellWithPrice = useMemo(
    () => Object.values(sellPriceData || {})?.find(asset => asset.uniqueId === assetToBuy?.uniqueId),
    [assetToBuy, sellPriceData]
  );

  const parsedAssetToBuy = useMemo(() => {
    if (!assetToBuy) return null;
    const userAsset = userAssets.find(userAsset => isSameAsset(userAsset, assetToBuy));
    return parseSearchAsset({
      assetWithPrice: assetToBuyWithPrice,
      searchAsset: assetToBuy,
      userAsset,
    });
  }, [assetToBuy, assetToBuyWithPrice, userAssets]);

  const parsedAssetToSell = useMemo(() => {
    if (!assetToSell) return null;
    const userAsset = userAssets.find(userAsset => isSameAsset(userAsset, assetToSell));
    return parseSearchAsset({
      assetWithPrice: assetToSellWithPrice,
      searchAsset: assetToSell,
      userAsset,
    });
  }, [assetToSell, assetToSellWithPrice, userAssets]);

  const setAssetToBuy = useCallback((asset: ParsedSearchAsset | null) => {
    setAssetToBuyState(asset);
  }, []);

  const setAssetToSell = useCallback(
    (asset: ParsedSearchAsset | null) => {
      if (assetToBuy && asset && assetToBuy?.address === asset?.address && assetToBuy?.chainId === asset?.chainId) {
        setAssetToBuyState(prevAssetToSell === undefined ? null : prevAssetToSell);
      }
      // if it's in bridge mode, the asset to sell changes, and it's not the same asset in different chains,
      // we clear the asset to buy (because that would be a crosschain swap)
      if (bridge && !isSameAssetInDiffChains(asset, assetToBuy)) {
        setAssetToBuyState(null);
      }
      setAssetToSellState(asset);
      asset?.chainId && setOutputChainId(asset?.chainId);
    },
    [assetToBuy, prevAssetToSell, bridge]
  );

  return {
    assetsToSell: filteredAssetsToSell,
    assetToSellFilter,
    assetsToBuy: searchAssetsToBuySections,
    assetToBuyFilter,
    sortMethod,
    assetToSell: parsedAssetToSell,
    assetToBuy: parsedAssetToBuy,
    outputChainId: bridge ? undefined : outputChainId,
    setSortMethod,
    setAssetToSell,
    setAssetToBuy,
    setOutputChainId: bridge ? undefined : setOutputChainId,
    setAssetToSellFilter,
    setAssetToBuyFilter,
  };
};
