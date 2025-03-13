import { NativeCurrencyKey } from '@/entities';
import useAccountSettings from './useAccountSettings';
import { parseAssetNative } from '@/parsers';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useSuperTokenStore } from '@/screens/token-launcher/state/rainbowSuperTokenStore';

// this is meant to be used for assets contained in the current wallet
export default function useAccountAsset(uniqueId: string, nativeCurrency: NativeCurrencyKey | undefined = undefined) {
  const accountAsset = useUserAssetsStore(state => state.getLegacyUserAsset(uniqueId));
  const rainbowSuperToken = useSuperTokenStore(state => state.getSuperToken(accountAsset?.address, accountAsset?.chainId));
  const removeSuperToken = useSuperTokenStore(state => state.removeSuperToken);
  // this is temporary for FastBalanceCoinRow to make a tiny bit faster
  // we pass nativeCurrency only in that case
  // for all the other cases it will work as expected
  const nativeCurrencyToUse =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    nativeCurrency ?? useAccountSettings().nativeCurrency;

  if (accountAsset) {
    let asset = accountAsset;
    // supplements data for tokens launched in rainbow while we wait for ingestion
    if (rainbowSuperToken) {
      if (asset.icon_url === '') {
        asset = {
          ...accountAsset,
          icon_url: rainbowSuperToken.imageUrl,
          type: 'rainbow',
        };
      } else {
        removeSuperToken(accountAsset.address, accountAsset.chainId);
      }
    }
    return parseAssetNative(asset, nativeCurrencyToUse);
  }
}
