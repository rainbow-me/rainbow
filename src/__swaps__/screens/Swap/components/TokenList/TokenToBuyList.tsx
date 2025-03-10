import React, { memo, useCallback, useMemo, useState } from 'react';
import { Insets, StyleSheet } from 'react-native';
import Animated, { runOnUI, useAnimatedRef, useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { analyticsV2 } from '@/analytics';
import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, Inline, Text, TextIcon, useColorMode } from '@/design-system';
import { palettes } from '@/design-system/color/palettes';
import * as i18n from '@/languages';
import { equalWorklet } from '@/safe-math/SafeMath';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { COIN_ROW_WITH_PADDING_HEIGHT, CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { useSearchCurrencyLists } from '@/__swaps__/screens/Swap/hooks/useSearchCurrencyLists';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { AssetToBuySectionId, SearchAsset, TokenToBuyListItem } from '@/__swaps__/types/search';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { getChainColorWorklet } from '@/__swaps__/utils/swaps';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { getUniqueId } from '@/utils/ethereumUtils';
import { EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT } from '../../constants';
import { useSwapsSearchStore } from '../../resources/search/searchV2';
import { ChainSelection } from './ChainSelection';

export const BUY_LIST_HEADER_HEIGHT = 20 + 10 + 10; // paddingTop + height + paddingBottom

const SCROLL_INDICATOR_INSETS = {
  focused: {
    bottom: 28 + (EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT),
  },
  unfocused: {
    bottom: 28,
  },
};

interface SectionHeaderProp {
  color: string | undefined;
  symbol: string;
  title: string;
}

const SECTION_HEADER_INFO: { [id in AssetToBuySectionId]: SectionHeaderProp } = {
  popular: {
    title: i18n.t(i18n.l.token_search.section_header.popular),
    symbol: '􀙬',
    color: 'rgba(255, 88, 77, 1)',
  },
  recent: {
    title: i18n.t(i18n.l.token_search.section_header.recent),
    symbol: '􀐫',
    color: 'rgba(38, 143, 255, 1)',
  },
  favorites: {
    title: i18n.t(i18n.l.token_search.section_header.favorites),
    symbol: '􀋃',
    color: 'rgba(255, 218, 36, 1)',
  },
  bridge: {
    title: i18n.t(i18n.l.token_search.section_header.bridge),
    symbol: '􀊝',
    color: undefined,
  },
  verified: {
    title: i18n.t(i18n.l.token_search.section_header.verified),
    symbol: '􀇻',
    color: 'rgba(38, 143, 255, 1)',
  },
  unverified: {
    title: i18n.t(i18n.l.token_search.section_header.unverified),
    symbol: '􀇿',
    color: 'rgba(255, 218, 36, 1)',
  },
  other_networks: {
    title: i18n.t(i18n.l.token_search.section_header.on_other_networks),
    symbol: '􀊫',
    color: palettes.dark.foregroundColors.blue,
  },
};

const getItemLayout = (data: ArrayLike<TokenToBuyListItem> | null | undefined, index: number) => {
  if (!data) return { length: 0, offset: 0, index };

  const item = data[index];
  const length = item?.listItemType === 'header' ? BUY_LIST_HEADER_HEIGHT : COIN_ROW_WITH_PADDING_HEIGHT;

  // Count headers up to this index
  let headerCount = 0;
  for (let i = 0; i < index; i++) {
    if (data[i]?.listItemType === 'header') {
      headerCount += 1;
    }
  }

  const coinRowCount = index - headerCount;
  const offset = headerCount * BUY_LIST_HEADER_HEIGHT + coinRowCount * COIN_ROW_WITH_PADDING_HEIGHT;

  return { length, offset, index };
};

const keyExtractor = (item: TokenToBuyListItem) => {
  return `${item.listItemType}-${item.listItemType === 'coinRow' ? item.uniqueId : item.id}`;
};

const getFormattedTestId = (name: string, chainId: ChainId) => {
  return `token-to-buy-${name}-${chainId}`.toLowerCase().replace(/\s+/g, '-');
};

const MemoizedCoinRow = memo(CoinRow, (prevProps, nextProps) => {
  return prevProps.uniqueId === nextProps.uniqueId && prevProps.isFavorite === nextProps.isFavorite;
});

export const TokenToBuyList = () => {
  const { internalSelectedInputAsset, internalSelectedOutputAsset, isFetching, isQuoteStale, outputProgress, setAsset } = useSwapContext();
  const { results: sections, isLoading } = useSearchCurrencyLists();

  const [supportedChainsBooleanMap] = useState(
    useBackendNetworksStore
      .getState()
      .getSupportedChainIds()
      .reduce((acc, chainId) => ({ ...acc, [chainId]: true }), {} as Record<ChainId, boolean>)
  );

  const handleSelectToken = useCallback(
    (token: SearchAsset) => {
      runOnUI(() => {
        if (
          internalSelectedInputAsset.value &&
          !equalWorklet(internalSelectedInputAsset.value.maxSwappableAmount, '0') &&
          getUniqueId(token.address, token.chainId) !== internalSelectedOutputAsset.value?.uniqueId
        ) {
          isQuoteStale.value = 1;
          isFetching.value = true;
        }
      })();

      const userAsset = userAssetsStore.getState().getUserAsset(token.uniqueId);
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: token,
        userAsset: userAsset ?? undefined,
      });

      setAsset({
        type: SwapAssetType.outputAsset,
        asset: parsedAsset,
      });

      const { searchQuery } = useSwapsSearchStore.getState();

      // track what search query the user had prior to selecting an asset
      if (searchQuery.trim().length) {
        analyticsV2.track(analyticsV2.event.swapsSearchedForToken, {
          query: searchQuery,
          type: 'output',
        });
      }
    },
    [internalSelectedInputAsset, internalSelectedOutputAsset, isFetching, isQuoteStale, setAsset]
  );

  const animatedListPadding = useAnimatedStyle(() => {
    const isFocused = outputProgress.value === 2;
    const bottomPadding = isFocused ? EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT : 0;
    return { height: bottomPadding };
  });

  const scrollIndicatorInsets = useDerivedValue<Insets | undefined>(() => {
    const isFocused = outputProgress.value === 2;
    return SCROLL_INDICATOR_INSETS[isFocused ? 'focused' : 'unfocused'];
  });

  const renderItem = useCallback(
    ({ item }: { item: TokenToBuyListItem }) => {
      if (item.listItemType === 'header') {
        return <TokenToBuySectionHeader sectionId={item.id} />;
      }
      return (
        <MemoizedCoinRow
          address={item.address}
          chainId={item.chainId}
          colors={item.colors}
          hideFavoriteButton={item.sectionId === 'other_networks'}
          icon_url={item.icon_url}
          isFavorite={item.favorite ?? false}
          isSupportedChain={supportedChainsBooleanMap[item.chainId] ?? false}
          isVerified={item.isNativeAsset || item.isVerified}
          mainnetAddress={item.mainnetAddress}
          name={item.name}
          onPress={() => handleSelectToken(item)}
          output
          symbol={item.symbol}
          testID={getFormattedTestId(item.name, item.chainId)}
          uniqueId={item.uniqueId}
        />
      );
    },
    [handleSelectToken, supportedChainsBooleanMap]
  );

  const listFooter = useMemo(() => {
    return <Animated.View style={[animatedListPadding, styles.listFooter]} />;
  }, [animatedListPadding]);

  const animatedRef = useAnimatedRef<Animated.FlatList<TokenToBuyListItem>>();

  if (isLoading) return null;

  return (
    <Box style={styles.list} testID={'token-to-buy-list'}>
      <ChainSelection animatedRef={animatedRef} output />
      <Animated.FlatList
        ListEmptyComponent={<ListEmpty output />}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.contentContainer}
        data={sections}
        getItemLayout={getItemLayout}
        initialNumToRender={12}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="always"
        maxToRenderPerBatch={8}
        ref={animatedRef}
        renderItem={renderItem}
        scrollIndicatorInsets={scrollIndicatorInsets}
        style={styles.list}
        windowSize={3}
      />
    </Box>
  );
};

interface TokenToBuySectionHeaderProps {
  sectionId: AssetToBuySectionId;
}

const TokenToBuySectionHeader = memo(function TokenToBuySectionHeader({ sectionId }: TokenToBuySectionHeaderProps) {
  const { symbol, title } = SECTION_HEADER_INFO[sectionId];

  const iconColor = useMemo(() => {
    const color = SECTION_HEADER_INFO[sectionId].color;
    if (color !== undefined) {
      return { custom: color };
    }
  }, [sectionId]);

  return (
    <Box
      height={BUY_LIST_HEADER_HEIGHT}
      justifyContent="center"
      paddingBottom="10px"
      paddingHorizontal="20px"
      paddingTop="20px"
      testID={`${sectionId}-token-to-buy-section-header`}
    >
      <Inline space="6px" alignVertical="center">
        {sectionId === 'bridge' ? (
          <BridgeHeaderIcon />
        ) : (
          <TextIcon color={iconColor || 'labelSecondary'} height={8} size="13pt" weight="heavy" width={16}>
            {symbol}
          </TextIcon>
        )}
        <Text size="15pt" weight="heavy" color="label">
          {title}
        </Text>
      </Inline>
    </Box>
  );
});

const BridgeHeaderIcon = memo(function BridgeHeaderIcon() {
  const { isDarkMode } = useColorMode();
  const { selectedOutputChainId } = useSwapContext();

  const iconColor = useAnimatedStyle(() => {
    return {
      color: withTiming(getChainColorWorklet(selectedOutputChainId.value || ChainId.mainnet, isDarkMode), TIMING_CONFIGS.fastFadeConfig),
    };
  });

  return (
    <AnimatedTextIcon height={8} size="13pt" textStyle={iconColor} weight="heavy" width={16}>
      {SECTION_HEADER_INFO.bridge.symbol}
    </AnimatedTextIcon>
  );
});

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
