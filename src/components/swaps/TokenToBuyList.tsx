import { FlatList } from 'react-native';
import { COIN_ROW_WITH_PADDING_HEIGHT, CoinRow } from '@/components/swaps/CoinRow';
import { ListEmpty } from '@/components/swaps/ListEmpty';
import { AssetToBuySectionId, useSearchCurrencyLists } from '@/components/swaps/hooks/useSearchCurrencyLists';
import { useSwapContext } from '@/components/swaps/providers/SwapProvider';
import { ChainId } from '@/chains/types';
import { SearchAsset } from '@/components/swaps/types/search';
import { SwapAssetType } from '@/components/swaps/types/swap';
import { parseSearchAsset } from '@/components/swaps/utils/assets';
import { getChainColorWorklet, getStandardizedUniqueIdWorklet } from '@/components/swaps/utils/swaps';
import { analyticsV2 } from '@/analytics';
import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, Inline, Stack, Text, TextIcon, useColorMode } from '@/design-system';
import { palettes } from '@/design-system/color/palettes';
import * as i18n from '@/languages';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useSwapsStore } from '@/state/swaps/swapsStore';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import React, { memo, useCallback, useMemo } from 'react';
import Animated, { runOnUI, useAnimatedProps, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT } from './constants';
import { ChainSelection } from './ChainSelection';
import { fetchSuggestions } from '@/handlers/ens';

export const BUY_LIST_HEADER_HEIGHT = 20 + 10 + 8; // paddingTop + height + paddingBottom

export interface SectionHeaderProp {
  color: string | undefined;
  symbol: string;
  title: string;
}

export const SECTION_HEADER_INFO: { [id in AssetToBuySectionId]: SectionHeaderProp } = {
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
  profiles: {
    title: i18n.t(i18n.l.discover.search.profiles),
    symbol: '􀉮',
    color: palettes.dark.foregroundColors.purple,
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

export type HeaderItem = { listItemType: 'header'; id: AssetToBuySectionId; data: SearchAsset[] };
export type CoinRowItem = SearchAsset & { listItemType: 'coinRow'; sectionId: AssetToBuySectionId };
export type ProfileRowItem = Awaited<ReturnType<typeof fetchSuggestions>>[number] & {
  listItemType: 'profileRow';
  sectionId: AssetToBuySectionId;
};
export type TokenToBuyListItem = HeaderItem | CoinRowItem | ProfileRowItem;

export const getFormattedTestId = (prefix: string, name: string, chainId: ChainId) => {
  return `${prefix}-${name}-${chainId}`.toLowerCase().replace(/\s+/g, '-');
};

export const getItemLayout = (data: ArrayLike<TokenToBuyListItem> | null | undefined, index: number) => {
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

export const TokenToBuyList = () => {
  const {
    internalSelectedInputAsset,
    internalSelectedOutputAsset,
    selectedOutputChainId,
    isFetching,
    isQuoteStale,
    outputProgress,
    setAsset,
  } = useSwapContext();

  const outputSearchQuery = useSwapsStore(state => state.outputSearchQuery.trim().toLowerCase());
  const { results: sections, isLoading } = useSearchCurrencyLists({
    assetToSell: internalSelectedInputAsset.value,
    selectedOutputChainId,
    searchQuery: outputSearchQuery,
  });

  const handleSelectToken = useCallback(
    (token: SearchAsset) => {
      runOnUI(() => {
        if (
          internalSelectedInputAsset.value &&
          getStandardizedUniqueIdWorklet({ address: token.address, chainId: token.chainId }) !== internalSelectedOutputAsset.value?.uniqueId
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

      // track what search query the user had prior to selecting an asset
      if (outputSearchQuery) {
        analyticsV2.track(analyticsV2.event.swapsSearchedForToken, {
          query: outputSearchQuery,
          type: 'output',
        });
      }
    },
    [internalSelectedInputAsset.value, internalSelectedOutputAsset.value?.uniqueId, isFetching, isQuoteStale, outputSearchQuery, setAsset]
  );

  const animatedListPadding = useAnimatedStyle(() => {
    const isFocused = outputProgress.value === 2;
    const bottomPadding = isFocused ? EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT : 0;
    return { height: bottomPadding };
  });

  const animatedListProps = useAnimatedProps(() => {
    const isFocused = outputProgress.value === 2;
    return {
      scrollIndicatorInsets: { bottom: 28 + (isFocused ? EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT : 0) },
    };
  });

  if (isLoading) return null;

  return (
    <Box style={{ height: EXPANDED_INPUT_HEIGHT - 77, width: DEVICE_WIDTH - 24 }} testID={'token-to-buy-list'}>
      <FlatList
        keyboardShouldPersistTaps="always"
        ListEmptyComponent={<ListEmpty output />}
        ListFooterComponent={<Animated.View style={[animatedListPadding, { width: '100%' }]} />}
        ListHeaderComponent={<ChainSelection output />}
        contentContainerStyle={{ paddingBottom: 16 }}
        data={sections}
        getItemLayout={getItemLayout}
        keyExtractor={item => {
          let id;
          if (item.listItemType === 'header') {
            id = item.id;
          } else if (item.listItemType === 'coinRow' || item.listItemType === 'profileRow') {
            id = item.uniqueId;
          }
          return `${item.listItemType}-${id}`;
        }}
        renderItem={({ item }) => {
          if (item.listItemType === 'header') {
            if (item.id === 'profiles') return null;
            return <TokenToBuySectionHeader section={{ data: item.data, id: item.id }} />;
          }
          if (item.listItemType === 'profileRow') {
            return null;
          }

          return (
            <CoinRow
              testID={getFormattedTestId('token-to-buy', item.name, item.chainId)}
              address={item.address}
              chainId={item.chainId}
              colors={item.colors}
              icon_url={item.icon_url}
              // @ts-expect-error item.favorite does not exist - it does for favorites, need to fix the type
              isFavorite={item.favorite}
              mainnetAddress={item.mainnetAddress}
              name={item.name}
              onPress={() => handleSelectToken(item)}
              output
              symbol={item.symbol}
              uniqueId={item.uniqueId}
            />
          );
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
    </Box>
  );
};

interface TokenToBuySectionHeaderProps {
  section: { id: AssetToBuySectionId; data: SearchAsset[] };
}

export const TokenToBuySectionHeader = memo(function TokenToBuySectionHeader({ section }: TokenToBuySectionHeaderProps) {
  const { symbol, title } = SECTION_HEADER_INFO[section.id];

  const iconColor = useMemo(() => {
    const color = SECTION_HEADER_INFO[section.id].color;
    if (color !== undefined) {
      return { custom: color };
    }
  }, [section.id]);

  return (
    <Box testID={`${section.id}-token-to-buy-section-header`}>
      <Stack space="8px">
        <Box paddingBottom="10px" paddingHorizontal="20px" paddingTop="20px">
          <Inline space="6px" alignVertical="center">
            {section.id === 'bridge' ? (
              <BridgeHeaderIcon />
            ) : (
              <TextIcon color={iconColor || 'labelSecondary'} size="13pt" weight="heavy" width={16}>
                {symbol}
              </TextIcon>
            )}
            <Text size="15pt" weight="heavy" color="label">
              {title}
            </Text>
          </Inline>
        </Box>
      </Stack>
    </Box>
  );
});

export const BridgeHeaderIcon = memo(function BridgeHeaderIcon() {
  const { isDarkMode } = useColorMode();
  const { selectedOutputChainId } = useSwapContext();

  const iconColor = useAnimatedStyle(() => {
    return {
      color: withTiming(getChainColorWorklet(selectedOutputChainId.value || ChainId.mainnet, isDarkMode), TIMING_CONFIGS.fastFadeConfig),
    };
  });

  return (
    <AnimatedTextIcon size="13pt" textStyle={iconColor} weight="heavy" width={16}>
      {SECTION_HEADER_INFO.bridge.symbol}
    </AnimatedTextIcon>
  );
});
