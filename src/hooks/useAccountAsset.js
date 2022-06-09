import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { AssetType } from '@rainbow-me/entities';
import { filterAssetsByBalanceSelector } from '@rainbow-me/helpers/assetSelectors';
import { parseAssetNative } from '@rainbow-me/parsers';
import { ETH_ADDRESS, ETH_ICON_URL } from '@rainbow-me/references';

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
export default function useAccountAsset(uniqueId) {
  const { nativeCurrency } = useAccountSettings();
  const assetsWithBalance = useSelector(filterAssetsByBalanceSelector);
  const assets = useSelector(({ data: { assetsData }}) => assetsData);
  const accountAsset = assetsWithBalance?.find(
    asset => asset.uniqueId === uniqueId
  );
  if (accountAsset) {
    return parseAssetNative(accountAsset, nativeCurrency);
  } else if (uniqueId === ETH_ADDRESS) {
    const eth = assets[ETH_ADDRESS];
    const result = parseAssetNative(eth, nativeCurrency);
    const placeholderEth = {
      ...getZeroEth(),
      ...result,
    };
    return placeholderEth;
  }
}
