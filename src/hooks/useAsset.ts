import { useMemo } from 'react';

import { type Address } from 'viem';

import { getUniqueId } from '@/entities/assetId';
import { type ChainId } from '@/features/network/types/backendNetworks';
import { useAppSettingsStore } from '@/features/settings/data/appSettingsStore';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';

import useAccountAsset from './useAccountAsset';

// To fetch an asset from account assets,
// generic assets, and uniqueTokens
export default function useAsset({ address, chainId }: { address: Address; chainId: ChainId }) {
  const nativeCurrency = useAppSettingsStore(state => state.currency);
  const uniqueId = getUniqueId(address, chainId);
  const accountAsset = useAccountAsset(uniqueId, nativeCurrency);
  const { data: externalAsset } = useExternalToken(
    {
      address,
      chainId,
      currency: nativeCurrency,
    },
    { enabled: !accountAsset }
  );

  return useMemo(() => {
    if (accountAsset) {
      return accountAsset;
    } else if (externalAsset) {
      return externalAsset;
    }

    return null;
  }, [accountAsset, externalAsset]);
}
