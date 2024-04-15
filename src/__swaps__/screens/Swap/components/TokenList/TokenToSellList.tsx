import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { useAssetsToSell } from '@/__swaps__/screens/Swap/hooks/useAssetsToSell';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { Stack } from '@/design-system';
import Animated, { runOnUI } from 'react-native-reanimated';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { parseSearchAsset, isSameAsset } from '@/__swaps__/utils/assets';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { FlashList } from '@shopify/flash-list';
import { ChainSelection } from './ChainSelection';

const AnimatedFlashListComponent = Animated.createAnimatedComponent(FlashList<ParsedSearchAsset>);

export const TokenToSellList = () => {
  const { SwapInputController } = useSwapContext();
  const userAssets = useAssetsToSell();

  const handleSelectToken = useCallback(
    (token: ParsedSearchAsset) => {
      const userAsset = userAssets.find(asset => isSameAsset(asset, token));
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: token,
        userAsset,
      });

      runOnUI(SwapInputController.onSetAssetToSell)(parsedAsset);
    },
    [SwapInputController.onSetAssetToSell, userAssets]
  );

  return (
    <Stack space="20px">
      <ChainSelection allText="All Networks" output={false} />

      <AnimatedFlashListComponent
        data={userAssets}
        ListEmptyComponent={<ListEmpty />}
        keyExtractor={item => item.uniqueId}
        renderItem={({ item }) => (
          <CoinRow
            key={item.uniqueId}
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
