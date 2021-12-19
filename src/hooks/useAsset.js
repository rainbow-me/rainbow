import { find, matchesProperty } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import useAccountAssets from './useAccountAssets';
import { AssetTypes } from '@rainbow-me/entities';
import store from '@rainbow-me/redux/store';
import { ETH_ADDRESS, ETH_ICON_URL } from '@rainbow-me/references';
import { convertAmountToNativeDisplay } from '@rainbow-me/utilities';

function getZeroEth() {
  const {
    data: { genericAssets },
    settings: { nativeCurrency },
  } = store.getState();

  const { relative_change_24h, value } = genericAssets?.eth?.price || {};

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
    isSmall: false,
    name: 'Ethereum',
    native: {
      balance: {
        amount: '0.00',
        display: convertAmountToNativeDisplay('0.00', nativeCurrency),
      },
      change: relative_change_24h ? `${relative_change_24h.toFixed(2)}%` : '',
      price: {
        amount: value || '0.00',
        display: convertAmountToNativeDisplay(
          value ? value : '0.00',
          nativeCurrency
        ),
      },
    },
    price: value,
    symbol: 'ETH',
    type: 'token',
    uniqueId: ETH_ADDRESS,
  };
}

export default function useAsset(asset) {
  const { allAssets, collectibles } = useAccountAssets();
  const genericAssets = useSelector(
    ({ data: { genericAssets } }) => genericAssets
  );

  return useMemo(() => {
    if (!asset) return null;

    let matched = null;
    if (asset.type === AssetTypes.token) {
      matched = find(allAssets, matchesProperty('uniqueId', asset.uniqueId));

      if (!matched) {
        matched = genericAssets?.[asset.mainnet_address || asset.address];
      }

      if (!matched && asset.uniqueId === ETH_ADDRESS) {
        return getZeroEth();
      }
    } else if (asset.type === AssetTypes.nft) {
      matched = find(collectibles, matchesProperty('uniqueId', asset.uniqueId));
    }

    return matched || asset;
  }, [allAssets, asset, collectibles, genericAssets]);
}
