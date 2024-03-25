import React, { useCallback } from 'react';
import { CoinRow } from '../CoinRow';
import { useAssetsToSell } from '../../hooks/useAssetsToSell';
import { ParsedSearchAsset } from '../../types/assets';
import { useSwapAssetStore } from '../../state/assets';
import { Stack } from '@/design-system';
import { runOnUI } from 'react-native-reanimated';
import { useSwapContext } from '../../providers/swap-provider';
import { parseSearchAsset, isSameAsset } from '../../utils/assets';

export const TokenToSellList = () => {
  const { SwapNavigation, SwapInputController } = useSwapContext();
  const { setAssetToSell, assetToBuy, setSearchFilter } = useSwapAssetStore();
  const userAssets = useAssetsToSell();

  const handleSelectToken = useCallback(
    (token: ParsedSearchAsset) => {
      const userAsset = userAssets.find(asset => isSameAsset(asset, token));
      const parsedAset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: token,
        userAsset,
      });

      setAssetToSell(parsedAset);

      runOnUI(() => {
        SwapInputController.inputValues.modify(prev => ({
          ...prev,
          inputAmount: userAsset?.balance.amount ?? '0', // TODO: Do we want to default to 100% of balance? 50%?
        }));
      })();

      setSearchFilter('');
      if (!assetToBuy) {
        runOnUI(SwapNavigation.handleFocusOutputSearch)();
      } else {
        runOnUI(SwapNavigation.handleExitSearch)();
      }
    },
    [
      SwapInputController.inputValues,
      SwapNavigation.handleExitSearch,
      SwapNavigation.handleFocusOutputSearch,
      assetToBuy,
      setAssetToSell,
      setSearchFilter,
      userAssets,
    ]
  );

  return (
    <Stack space="20px">
      {userAssets.map((token: ParsedSearchAsset) => (
        <CoinRow
          key={token.uniqueId}
          chainId={token.chainId}
          color={token.colors?.primary ?? token.colors?.fallback}
          iconUrl={token.icon_url}
          address={token.address}
          mainnetAddress={token.mainnetAddress}
          balance={token.balance.display}
          name={token.name}
          onPress={() => handleSelectToken(token)}
          nativeBalance={token.native.balance.display}
          output={false}
          symbol={token.symbol}
        />
      ))}
    </Stack>
  );
};
