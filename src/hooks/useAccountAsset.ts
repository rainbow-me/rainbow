import type { NativeCurrencyKey } from '@/features/currency/types';
import { parseAssetNative } from '@/parsers/accounts';
import { useSuperTokenStore } from '@/screens/token-launcher/state/rainbowSuperTokenStore';
import { useUserAssetsStore } from '@/state/assets/userAssets';

/**
 * Returns the current wallet's asset formatted in the supplied currency, or undefined if absent.
 */
export default function useAccountAsset(uniqueId: string, nativeCurrency: NativeCurrencyKey) {
  const accountAsset = useUserAssetsStore(state => state.getLegacyUserAsset(uniqueId));
  const rainbowSuperToken = useSuperTokenStore(state => state.getSuperToken(accountAsset?.address, accountAsset?.chainId));

  if (accountAsset) {
    let asset = accountAsset;
    // supplements data for tokens launched in rainbow while we wait for ingestion
    if (rainbowSuperToken) {
      asset = {
        ...accountAsset,
        icon_url: rainbowSuperToken.imageUrl,
        type: 'rainbow',
        color: rainbowSuperToken.color,
        colors: {
          primary: rainbowSuperToken.color || '',
        },
      };
    }
    return parseAssetNative(asset, nativeCurrency);
  }
}
