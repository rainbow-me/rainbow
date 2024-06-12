import { FlashList } from '@shopify/flash-list';
import React, { memo, useCallback, useMemo } from 'react';
import Animated, { runOnUI, useAnimatedProps, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { analyticsV2 } from '@/analytics';
import { AnimatedTextIcon } from '@/components/AnimatedComponents/AnimatedTextIcon';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, Inline, Stack, Text, TextIcon, useColorMode } from '@/design-system';
import { palettes } from '@/design-system/color/palettes';
import * as i18n from '@/languages';
import { userAssetsStore } from '@/state/assets/userAssets';
import { swapsStore } from '@/state/swaps/swapsStore';
import { COIN_ROW_WITH_PADDING_HEIGHT, CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { AssetToBuySectionId, useSearchCurrencyLists } from '@/__swaps__/screens/Swap/hooks/useSearchCurrencyLists';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { ChainId } from '@/__swaps__/types/chains';
import { SearchAsset } from '@/__swaps__/types/search';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { getChainColorWorklet, getStandardizedUniqueIdWorklet } from '@/__swaps__/utils/swaps';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { EXPANDED_INPUT_HEIGHT, FOCUSED_INPUT_HEIGHT } from '../../constants';
import { ChainSelection } from './ChainSelection';

export const BUY_LIST_HEADER_HEIGHT = 20 + 10 + 8; // paddingTop + height + paddingBottom

interface SectionHeaderProp {
  color: string | undefined;
  symbol: string;
  title: string;
}

const SECTION_HEADER_INFO: { [id in AssetToBuySectionId]: SectionHeaderProp } = {
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

export type HeaderItem = { listItemType: 'header'; id: AssetToBuySectionId; data: SearchAsset[] };
export type CoinRowItem = SearchAsset & { listItemType: 'coinRow'; sectionId: AssetToBuySectionId };
export type TokenToBuyListItem = HeaderItem | CoinRowItem;

export const TokenToBuyList = () => {
  const { internalSelectedInputAsset, internalSelectedOutputAsset, isFetching, isQuoteStale, outputProgress, setAsset } = useSwapContext();
  const { results: sections } = useSearchCurrencyLists();

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

      const { outputSearchQuery } = swapsStore.getState();

      // track what search query the user had prior to selecting an asset
      if (outputSearchQuery.trim().length) {
        analyticsV2.track(analyticsV2.event.swapsSearchedForToken, {
          query: outputSearchQuery,
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

  const animatedListProps = useAnimatedProps(() => {
    const isFocused = outputProgress.value === 2;
    return {
      scrollIndicatorInsets: { bottom: 28 + (isFocused ? EXPANDED_INPUT_HEIGHT - FOCUSED_INPUT_HEIGHT : 0) },
    };
  });

  const averageItemSize = useMemo(() => {
    const numberOfHeaders = sections.filter(section => section.listItemType === 'header').length;
    const numberOfCoinRows = sections.filter(section => section.listItemType === 'coinRow').length;
    const totalHeight = numberOfHeaders * BUY_LIST_HEADER_HEIGHT + numberOfCoinRows * COIN_ROW_WITH_PADDING_HEIGHT;
    return totalHeight / (numberOfHeaders + numberOfCoinRows);
  }, [sections]);

  return (
    <Box style={{ height: EXPANDED_INPUT_HEIGHT - 77, width: DEVICE_WIDTH - 24 }}>
      <FlashList
        ListEmptyComponent={<ListEmpty output />}
        ListFooterComponent={<Animated.View style={[animatedListPadding, { width: '100%' }]} />}
        ListHeaderComponent={<ChainSelection output />}
        contentContainerStyle={{ paddingBottom: 16 }}
        // For some reason shallow copying the list data allows FlashList to more quickly pick up changes
        data={sections.slice(0)}
        estimatedFirstItemOffset={BUY_LIST_HEADER_HEIGHT}
        estimatedItemSize={averageItemSize}
        estimatedListSize={{ height: EXPANDED_INPUT_HEIGHT - 77, width: DEVICE_WIDTH - 24 }}
        getItemType={item => item.listItemType}
        keyExtractor={item => `${item.listItemType}-${item.listItemType === 'coinRow' ? item.uniqueId : item.id}`}
        renderItem={({ item }) => {
          if (item.listItemType === 'header') {
            return <TokenToBuySectionHeader section={{ data: item.data, id: item.id }} />;
          }
          return (
            <CoinRow
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

const TokenToBuySectionHeader = memo(function TokenToBuySectionHeader({ section }: TokenToBuySectionHeaderProps) {
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

const BridgeHeaderIcon = memo(function BridgeHeaderIcon() {
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
