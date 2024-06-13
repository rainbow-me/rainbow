import React, { useCallback, useMemo } from 'react';
import { COIN_ROW_WITH_PADDING_HEIGHT, CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import Animated, { runOnUI, useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { FlashList } from '@shopify/flash-list';
import { ChainSelection } from './ChainSelection';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { userAssetsStore } from '@/state/assets/userAssets';
import { EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT } from '../../constants';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getStandardizedUniqueIdWorklet } from '@/__swaps__/utils/swaps';
import { useDelayedMount } from '@/hooks/useDelayedMount';
import { swapsStore } from '@/state/swaps/swapsStore';
import { analyticsV2 } from '@/analytics';

export const SELL_LIST_HEADER_HEIGHT = 20 + 10 + 14; // paddingTop + height + paddingBottom

const isInitialInputAssetNull = () => {
  return !swapsStore.getState().inputAsset;
};

export const TokenToSellList = () => {
  const skipDelayedMount = useMemo(() => isInitialInputAssetNull(), []);
  const shouldMount = useDelayedMount({ skipDelayedMount });

  return shouldMount ? <TokenToSellListComponent /> : null;
};

const TokenToSellListComponent = () => {
  const { inputProgress, internalSelectedInputAsset, internalSelectedOutputAsset, isFetching, isQuoteStale, setAsset } = useSwapContext();

  const userAssetIds = userAssetsStore(state => state.getFilteredUserAssetIds());

  const handleSelectToken = useCallback(
    (token: ParsedSearchAsset | null) => {
      if (!token) return;

      runOnUI(() => {
        if (
          internalSelectedOutputAsset.value &&
          getStandardizedUniqueIdWorklet({ address: token.address, chainId: token.chainId }) !== internalSelectedInputAsset.value?.uniqueId
        ) {
          isQuoteStale.value = 1;
          isFetching.value = true;
        }
      })();

      setAsset({
        type: SwapAssetType.inputAsset,
        asset: token,
      });

      const { inputSearchQuery } = userAssetsStore.getState();

      // track what search query the user had prior to selecting an asset
      if (inputSearchQuery.trim().length) {
        analyticsV2.track(analyticsV2.event.swapsSearchedForToken, {
          query: inputSearchQuery,
          type: 'input',
        });
      }
    },
    [internalSelectedInputAsset, internalSelectedOutputAsset, isFetching, isQuoteStale, setAsset]
  );

  const animatedListPadding = useAnimatedStyle(() => {
    const isFocused = inputProgress.value === 2;
    const bottomPadding = isFocused ? EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT : 0;
    return { height: bottomPadding };
  });

  const animatedListProps = useAnimatedProps(() => {
    const isFocused = inputProgress.value === 2;
    return {
      scrollIndicatorInsets: { bottom: 28 + (isFocused ? EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT : 0) },
    };
  });

  return (
    <FlashList
      ListEmptyComponent={<ListEmpty />}
      ListFooterComponent={<Animated.View style={[animatedListPadding, { width: '100%' }]} />}
      ListHeaderComponent={<ChainSelection allText="All Networks" output={false} />}
      contentContainerStyle={{ paddingBottom: 16 }}
      // For some reason shallow copying the list data allows FlashList to more quickly pick up changes
      data={userAssetIds.slice(0)}
      estimatedFirstItemOffset={SELL_LIST_HEADER_HEIGHT}
      estimatedItemSize={COIN_ROW_WITH_PADDING_HEIGHT}
      estimatedListSize={{ height: EXPANDED_INPUT_HEIGHT - 77, width: DEVICE_WIDTH - 24 }}
      keyExtractor={uniqueId => uniqueId}
      renderItem={({ item: uniqueId }) => {
        return <CoinRow onPress={(asset: ParsedSearchAsset | null) => handleSelectToken(asset)} output={false} uniqueId={uniqueId} />;
      }}
      renderScrollComponent={props => {
        return (
          <Animated.ScrollView
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            animatedProps={animatedListProps}
          />
        );
      }}
      style={{ height: EXPANDED_INPUT_HEIGHT - 77, width: DEVICE_WIDTH - 24 }}
    />
  );
};
