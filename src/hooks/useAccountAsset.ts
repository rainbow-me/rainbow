import useAccountSettings from './useAccountSettings';
import useGenericAsset from './useGenericAsset';
import { AssetType } from '@/entities';
import { parseAssetNative } from '@/parsers';
import { ETH_ADDRESS, ETH_ICON_URL } from '@/references';
import { useUserAsset } from '@/resources/assets/useUserAsset';

const getZeroEth = () => {
  return {
    address: ETH_ADDRESS,
    balance: {
      amount: '0',
      display: '0 ETH',
    },
    color: '#29292E',
    decimals: 18,
    icon_url: ETH_ICON_URL,
    isCoin: true,
    isPlaceholder: true,
    isSmall: false,
    name: 'Ethereum',
    symbol: 'ETH',
    type: AssetType.token,
    uniqueId: ETH_ADDRESS,
  };
};

// this is meant to be used for assets under balances
// with a fallback for generic assets
// and an ETH placeholder
// NFTs are not included in this hook
export default function useAccountAsset(
  uniqueId: string,
  nativeCurrency: string | undefined = undefined
) {
  const { data: accountAsset } = useUserAsset(uniqueId);

  const genericAssetBackup = useGenericAsset(uniqueId);

  // this is temporary for FastBalanceCoinRow to make a tiny bit faster
  // we pass nativeCurrency only in that case
  // for all the other cases it will work as expected
  const nativeCurrencyToUse =
    // eslint-disable-next-line react-hooks/rules-of-hooks
    nativeCurrency ?? useAccountSettings().nativeCurrency;

  if (accountAsset) {
    return parseAssetNative(accountAsset, nativeCurrencyToUse);
  } else if (uniqueId === ETH_ADDRESS) {
    const result = parseAssetNative(genericAssetBackup, nativeCurrencyToUse);
    const placeholderEth = {
      ...getZeroEth(),
      ...result,
    };
    return placeholderEth;
  } else {
    return genericAssetBackup;
  }
}
