import { useCallback, useMemo, useState } from 'react';

import { useUserAssets } from '@/resources/assets/UserAssetsQuery';
import { ParsedAsset, SearchAsset, ParsedSearchAsset } from '@/resources/assets/types';
import { ChainId } from '@rainbow-me/swaps';

import { SortMethod } from '@/__swaps__/screens/Swap/types/search';
import { useDebounce } from '@/__swaps__/screens/Swap/hooks/useDebounce';
import { usePrevious } from '@/__swaps__/screens/Swap/hooks/usePrevious';
// import { useSearchCurrencyLists } from '@/__swaps__/screens/Swap/hooks/useSearchCurrencyLists';
import { useAccountProfile, useAccountSettings } from '@/hooks';

const isLowerCaseMatch = (a?: string, b?: string) => a?.toLowerCase() === b?.toLowerCase();

export const isSameAsset = (a1: Pick<ParsedAsset, 'network' | 'address'>, a2: Pick<ParsedAsset, 'network' | 'address'>) =>
  +a1.network === +a2.network && isLowerCaseMatch(a1.address, a2.address);

const isSameAssetInDiffChains = (a1?: Pick<ParsedAsset, 'address' | 'networks'> | null, a2?: Pick<ParsedAsset, 'address'> | null) => {
  if (!a1?.networks || !a2) return false;
  return Object.values(a1.networks).some(assetInNetwork => assetInNetwork?.address === a2.address);
};

export const useSwapAssets = ({ bridge }: { bridge: boolean }) => {
  const { accountAddress } = useAccountProfile();
  const { nativeCurrency } = useAccountSettings();

  const [assetToSell, setAssetToSellState] = useState<ParsedSearchAsset | SearchAsset | null>(null);
  const [assetToBuy, setAssetToBuyState] = useState<ParsedSearchAsset | SearchAsset | null>(null);

  const prevAssetToSell = usePrevious<ParsedSearchAsset | SearchAsset | null>(assetToSell);

  const [outputChainId, setOutputChainId] = useState<ChainId>(ChainId.mainnet);
  const [sortMethod, setSortMethod] = useState<SortMethod>('token');
  const [assetToSellFilter, setAssetToSellFilter] = useState('');
  const [assetToBuyFilter, setAssetToBuyFilter] = useState('');

  const debouncedAssetToSellFilter = useDebounce(assetToSellFilter, 200);
  // const debouncedAssetToBuyFilter = useDebounce(assetToBuyFilter, 200);

  const { data: userAssets = {} } = useUserAssets({
    address: accountAddress,
    currency: nativeCurrency,
    connectedToHardhat: false,
  });

  const filteredAssetsToSell = useMemo(() => {
    return debouncedAssetToSellFilter
      ? Object.values(userAssets).filter(({ name, symbol, address }) =>
          [name, symbol, address].reduce(
            (res, param) => res || param.toLowerCase().startsWith(debouncedAssetToSellFilter.toLowerCase()),
            false
          )
        )
      : userAssets;
  }, [debouncedAssetToSellFilter, userAssets]) as ParsedSearchAsset[];

  // const { results: searchAssetsToBuySections } = useSearchCurrencyLists({
  //   inputChainId: assetToSell?.chainId,
  //   outputChainId,
  //   assetToSell,
  //   searchQuery: debouncedAssetToBuyFilter,
  //   bridge,
  // });

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
    // assetsToBuy: searchAssetsToBuySections,
    assetToBuyFilter,
    sortMethod,
    assetToSell,
    assetToBuy,
    outputChainId: bridge ? undefined : outputChainId,
    setSortMethod,
    setAssetToSell,
    setAssetToBuy,
    setOutputChainId: bridge ? undefined : setOutputChainId,
    setAssetToSellFilter,
    setAssetToBuyFilter,
  };
};
