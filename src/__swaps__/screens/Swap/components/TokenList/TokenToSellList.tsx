import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { useAssetsToSell } from '@/__swaps__/screens/Swap/hooks/useAssetsToSell';
import { ParsedSearchAsset, UniqueId } from '@/__swaps__/types/assets';
import { Stack } from '@/design-system';
import Animated from 'react-native-reanimated';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { FlashList } from '@shopify/flash-list';
import { ChainSelection } from './ChainSelection';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { userAssetsStore } from '@/state/assets/userAssets';
import { Hex } from 'viem';

const AnimatedFlashListComponent = Animated.createAnimatedComponent(FlashList<ParsedSearchAsset>);

export const TokenToSellList = () => {
  const { setAsset } = useSwapContext();
  // const userAssets = useAssetsToSell();

  const userAssetIds = userAssetsStore(state => state.userAssetIds);

  const handleSelectToken = useCallback(
    (assetId: UniqueId) => {
      const userAsset = userAssetsStore.getState().getUserAsset(assetId);
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: userAsset,
        userAsset,
      });

      setAsset({
        type: SwapAssetType.inputAsset,
        asset: parsedAsset,
      });
    },
    [setAsset]
  );

  return (
    <Stack space="20px">
      <ChainSelection allText="All Networks" output={false} />

      <FlashList
        data={userAssetIds}
        ListEmptyComponent={<ListEmpty />}
        keyExtractor={item => item}
        renderItem={({ item }) => <CoinRow assetId={item} output={false} onPress={handleSelectToken} />}
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
