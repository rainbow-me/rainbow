import { FlatList } from 'react-native';
import { COIN_ROW_WITH_PADDING_HEIGHT, CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { getUniqueId } from '@/utils/ethereumUtils';
import { analyticsV2 } from '@/analytics';
import { useDelayedMount } from '@/hooks/useDelayedMount';
import * as i18n from '@/languages';
import { userAssetsStore, useUserAssetsStore } from '@/state/assets/userAssets';
import { swapsStore } from '@/state/swaps/swapsStore';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import React, { useCallback, useMemo } from 'react';
import Animated, { runOnUI, useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import { EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT } from '../../constants';
import { ChainSelection } from './ChainSelection';

export const SELL_LIST_HEADER_HEIGHT = 20 + 10 + 14; // paddingTop + height + paddingBottom

const isInitialInputAssetNull = () => {
  return !swapsStore.getState().inputAsset;
};

const getItemLayout = (_: ArrayLike<string> | null | undefined, index: number) => ({
  length: COIN_ROW_WITH_PADDING_HEIGHT,
  offset: COIN_ROW_WITH_PADDING_HEIGHT * index,
  index,
});

export const TokenToSellList = () => {
  const skipDelayedMount = useMemo(() => isInitialInputAssetNull(), []);
  const shouldMount = useDelayedMount({ skipDelayedMount });

  return shouldMount ? <TokenToSellListComponent /> : null;
};

const TokenToSellListComponent = () => {
  const { inputProgress, internalSelectedInputAsset, internalSelectedOutputAsset, isFetching, isQuoteStale, setAsset } = useSwapContext();

  const userAssetIds = useUserAssetsStore(state => state.getFilteredUserAssetIds());

  const handleSelectToken = useCallback(
    (token: ParsedSearchAsset | null) => {
      if (!token) return;

      runOnUI(() => {
        if (internalSelectedOutputAsset.value && getUniqueId(token.address, token.chainId) !== internalSelectedInputAsset.value?.uniqueId) {
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
    <>
      <ChainSelection allText={i18n.t(i18n.l.exchange.all_networks)} output={false} />
      <FlatList
        ListEmptyComponent={<ListEmpty />}
        ListFooterComponent={<Animated.View style={[animatedListPadding, { width: '100%' }]} />}
        contentContainerStyle={{ paddingBottom: 16 }}
        data={userAssetIds}
        getItemLayout={getItemLayout}
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
    </>
  );
};
