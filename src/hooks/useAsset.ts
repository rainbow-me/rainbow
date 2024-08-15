import { useMemo } from 'react';
import { Network } from '@/networks/types';
import { getChainIdFromNetwork } from '@/utils/ethereumUtils';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { getStandardizedUniqueIdWorklet } from '@/__swaps__/utils/swaps';
import { AddressOrEth } from '@/__swaps__/types/assets';
import { userAssetsStore } from '@/state/assets/userAssets';

// To fetch an asset from account assets,
// generic assets, and uniqueTokens
export default function useAsset({ address, network }: { address: string; network: Network }) {
  const nativeCurrency = useSelector((state: AppState) => state.settings.nativeCurrency);
  const uniqueId = getStandardizedUniqueIdWorklet({ address: address as AddressOrEth, chainId: getChainIdFromNetwork(network) });
  const accountAsset = userAssetsStore(state => state.getUserAsset(uniqueId));
  const { data: externalAsset } = useExternalToken({
    address,
    network,
    currency: nativeCurrency,
  });

  return useMemo(() => {
    if (accountAsset) {
      return accountAsset;
    } else if (externalAsset) {
      return externalAsset;
    }

    return null;
  }, [accountAsset, externalAsset]);
}
