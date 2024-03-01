import { useMemo } from 'react';
import useAccountAsset from './useAccountAsset';
import { Network } from '@/networks/types';
import ethereumUtils, { getUniqueId } from '@/utils/ethereumUtils';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';

// To fetch an asset from account assets,
// generic assets, and uniqueTokens
export default function useAsset({ address, network }: { address: string; network: Network }) {
  const nativeCurrency = useSelector((state: AppState) => state.settings.nativeCurrency);
  const uniqueId = getUniqueId(address, network);
  const accountAsset = useAccountAsset(uniqueId);
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
