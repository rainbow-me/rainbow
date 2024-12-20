import { useMemo } from 'react';
import useAccountAsset from './useAccountAsset';
import { getUniqueId } from '@/utils/ethereumUtils';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';
import { ChainId } from '@/state/backendNetworks/types';
import { Address } from 'viem';

// To fetch an asset from account assets,
// generic assets, and uniqueTokens
export default function useAsset({ address, chainId }: { address: Address; chainId: ChainId }) {
  const nativeCurrency = useSelector((state: AppState) => state.settings.nativeCurrency);
  const uniqueId = getUniqueId(address, chainId);
  const accountAsset = useAccountAsset(uniqueId);
  const { data: externalAsset } = useExternalToken({
    address,
    chainId,
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
