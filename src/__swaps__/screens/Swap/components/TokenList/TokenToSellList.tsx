import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { useAssetsToSell } from '@/__swaps__/screens/Swap/hooks/useAssetsToSell';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { Stack } from '@/design-system';
import { runOnUI } from 'react-native-reanimated';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { FlashList } from '@shopify/flash-list';
import { ChainSelection } from './ChainSelection';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { userAssetsStore } from '@/state/assets/userAssets';
import { EXPANDED_INPUT_HEIGHT } from '../../constants';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getStandardizedUniqueIdWorklet } from '@/__swaps__/utils/swaps';
import { useDelayedMount } from '@/hooks/useDelayedMount';

export const TokenToSellList = () => {
  const shouldMount = useDelayedMount();
  return shouldMount ? <TokenToSellListComponent /> : null;
};

const TokenToSellListComponent = () => {
  const { internalSelectedInputAsset, internalSelectedOutputAsset, isFetching, isQuoteStale, setAsset } = useSwapContext();
  const userAssets = useAssetsToSell();

  const handleSelectToken = useCallback(
    (token: ParsedSearchAsset) => {
      runOnUI(() => {
        if (
          internalSelectedOutputAsset.value &&
          getStandardizedUniqueIdWorklet({ address: token.address, chainId: token.chainId }) !== internalSelectedInputAsset.value?.uniqueId
        ) {
          isQuoteStale.value = 1;
          isFetching.value = true;
        }
      })();

      const userAsset = userAssetsStore.getState().getUserAsset(token.uniqueId);
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: token,
        userAsset,
      });

      setAsset({
        type: SwapAssetType.inputAsset,
        asset: parsedAsset,
      });
    },
    [internalSelectedInputAsset, internalSelectedOutputAsset, isFetching, isQuoteStale, setAsset]
  );

  return (
    <Stack space="20px">
      <ChainSelection allText="All Networks" output={false} />

      <FlashList
        data={userAssets}
        estimatedListSize={{ height: EXPANDED_INPUT_HEIGHT - 77, width: DEVICE_WIDTH - 24 }}
        ListEmptyComponent={<ListEmpty />}
        keyExtractor={item => item.uniqueId}
        renderItem={({ item }) => (
          <CoinRow
            chainId={item.chainId}
            color={item.colors?.primary ?? item.colors?.fallback}
            iconUrl={item.icon_url}
            address={item.address}
            mainnetAddress={item.mainnetAddress}
            balance={item.balance.display}
            name={item.name}
            onPress={() => handleSelectToken(item)}
            nativeBalance={item.native.balance.display}
            output={false}
            symbol={item.symbol}
          />
        )}
      />
    </Stack>
  );
};

export const styles = StyleSheet.create({
  textIconGlow: {
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
