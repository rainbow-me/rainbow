import { NativeCurrencyKey } from '@/entities';
import useAccountSettings from './useAccountSettings';
import { parseAssetNative } from '@/parsers';
import { useUserAssetsStore } from '@/state/assets/userAssets';

// this is meant to be used for assets contained in the current wallet
export default function useAccountAsset(uniqueId: string, nativeCurrency: NativeCurrencyKey | undefined = undefined) {
  const accountAsset = useUserAssetsStore(state => state.getLegacyUserAsset(uniqueId));

  // this is temporary for FastBalanceCoinRow to make a tiny bit faster
  // we pass nativeCurrency only in that case
  // for all the other cases it will work as expected
  const nativeCurrencyToUse =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    nativeCurrency ?? useAccountSettings().nativeCurrency;

  if (accountAsset) {
    return parseAssetNative(accountAsset, nativeCurrencyToUse);
  }
}
