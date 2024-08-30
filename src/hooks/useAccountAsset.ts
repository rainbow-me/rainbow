import useAccountSettings from './useAccountSettings';
import { parseAssetNative } from '@/parsers';
import { useUserAsset } from '@/resources/assets/useUserAsset';

// this is meant to be used for assets contained in the current wallet
export default function useAccountAsset(uniqueId: string, nativeCurrency: string | undefined = undefined) {
  const { data: accountAsset } = useUserAsset(uniqueId);

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
