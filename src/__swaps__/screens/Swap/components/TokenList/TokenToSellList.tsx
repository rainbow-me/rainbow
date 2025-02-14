import React, { memo, useCallback, useMemo, useState } from 'react';
import { Insets, InteractionManager, StyleSheet } from 'react-native';
import Animated, { runOnUI, useAnimatedRef, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { analyticsV2 } from '@/analytics';
import { useDelayedMount } from '@/hooks/useDelayedMount';
import * as i18n from '@/languages';
import { userAssetsStore, useUserAssetsStore } from '@/state/assets/userAssets';
import { swapsStore } from '@/state/swaps/swapsStore';
import { COIN_ROW_WITH_PADDING_HEIGHT, CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ParsedSearchAsset, UniqueId } from '@/__swaps__/types/assets';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT } from '../../constants';
import { ChainSelection } from './ChainSelection';

export const SELL_LIST_HEADER_HEIGHT = 20 + 10 + 14; // paddingTop + height + paddingBottom

const SCROLL_INDICATOR_INSETS = {
  focused: {
    bottom: 28 + (EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT),
  },
  unfocused: {
    bottom: 28,
  },
};

const getItemLayout = (_: ArrayLike<string> | null | undefined, index: number) => ({
  length: COIN_ROW_WITH_PADDING_HEIGHT,
  offset: COIN_ROW_WITH_PADDING_HEIGHT * index,
  index,
});

const isInitialInputAssetNull = () => {
  return !swapsStore.getState().inputAsset;
};

export const TokenToSellList = () => {
  const [skipDelayedMount] = useState(isInitialInputAssetNull());
  const shouldMount = useDelayedMount({ skipDelayedMount });

  return shouldMount ? <TokenToSellListComponent /> : null;
};

const MemoizedCoinRow = memo(CoinRow);

const TokenToSellListComponent = () => {
  const { inputProgress, internalSelectedInputAsset, internalSelectedOutputAsset, isFetching, isQuoteStale, setAsset } = useSwapContext();

  const userAssetIds = useUserAssetsStore(state => state.getFilteredUserAssetIds());
  const userAssets = useUserAssetsStore(state => state.userAssets);

  const searchResultsMap = useMemo(() => {
    const assets = new Map<UniqueId, ParsedSearchAsset>();
    for (let i = 0; i < userAssetIds.length; i++) {
      const asset = userAssets.get(userAssetIds[i]);
      if (asset) assets.set(asset.uniqueId, asset);
    }
    return assets;
  }, [userAssetIds, userAssets]);

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

      const inputSearchQuery = userAssetsStore.getState().inputSearchQuery.trim();
      setTimeout(() => {
        InteractionManager.runAfterInteractions(() => {
          // track what search query the user had prior to selecting an asset
          if (inputSearchQuery.length) {
            analyticsV2.track(analyticsV2.event.swapsSearchedForToken, {
              query: inputSearchQuery,
              type: 'input',
            });
          }
        });
      }, 200);
    },
    [internalSelectedInputAsset, internalSelectedOutputAsset, isFetching, isQuoteStale, setAsset]
  );

  const animatedListPadding = useAnimatedStyle(() => {
    const isFocused = inputProgress.value === 2;
    const bottomPadding = isFocused ? EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT : 0;
    return { height: bottomPadding };
  });

  const scrollIndicatorInsets = useDerivedValue<Insets | undefined>(() => {
    const isFocused = inputProgress.value === 2;
    return SCROLL_INDICATOR_INSETS[isFocused ? 'focused' : 'unfocused'];
  });

  const renderItem = useCallback(
    ({ item: uniqueId }: { item: string }) => {
      return <MemoizedCoinRow onPress={handleSelectToken} output={false} uniqueIdOrAsset={searchResultsMap.get(uniqueId) || uniqueId} />;
    },
    [handleSelectToken, searchResultsMap]
  );

  const listFooter = useMemo(() => {
    return <Animated.View style={[animatedListPadding, styles.listFooter]} />;
  }, [animatedListPadding]);

  const animatedRef = useAnimatedRef<Animated.FlatList<string>>();

  return (
    <>
      <ChainSelection allText={i18n.t(i18n.l.exchange.all_networks)} animatedRef={animatedRef} output={false} />
      <Animated.FlatList
        ListEmptyComponent={<ListEmpty />}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.contentContainer}
        data={userAssetIds}
        getItemLayout={getItemLayout}
        initialNumToRender={8}
        keyExtractor={uniqueId => uniqueId}
        keyboardShouldPersistTaps="always"
        maxToRenderPerBatch={8}
        ref={animatedRef}
        renderItem={renderItem}
        scrollIndicatorInsets={scrollIndicatorInsets}
        style={styles.list}
        windowSize={3}
      />
    </>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    paddingBottom: 16,
  },
  list: {
    height: EXPANDED_INPUT_HEIGHT - 77,
    width: DEVICE_WIDTH - 24,
  },
  listFooter: {
    width: '100%',
  },
});
