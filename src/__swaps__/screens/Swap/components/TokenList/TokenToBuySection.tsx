import React, { useCallback } from 'react';
import { TextStyle } from 'react-native';
import Animated, { useDerivedValue, SharedValue, useAnimatedStyle, useAnimatedProps } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';

import * as i18n from '@/languages';
import { CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { SearchAsset } from '@/__swaps__/types/search';
import { AnimatedText, Box, Inline, Inset, Stack, Text } from '@/design-system';
import { AssetToBuySection, AssetToBuySectionId } from '@/__swaps__/screens/Swap/hooks/useSearchCurrencyLists';
import { ChainId } from '@/__swaps__/types/chains';
import { TextColor } from '@/design-system/color/palettes';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { parseSearchAsset, isSameAsset } from '@/__swaps__/utils/assets';
import { useFavorites } from '@/resources/favorites';

import { useAssetsToSell } from '@/__swaps__/screens/Swap/hooks/useAssetsToSell';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { ETH_ADDRESS } from '@/references';
import { AnimatedCoinRow } from '../AnimatedCoinRow';
import { useAssetsToSellSV } from '../../hooks/useAssetsToSellSV';

interface SectionProp {
  color: TextStyle['color'];
  symbol: string;
  title: string;
}

const sectionProps: { [id in AssetToBuySectionId]: SectionProp } = {
  favorites: {
    title: i18n.t(i18n.l.token_search.section_header.favorites),
    symbol: '􀋃',
    color: 'rgba(255, 218, 36, 1)',
  },
  bridge: {
    title: i18n.t(i18n.l.token_search.section_header.bridge),
    symbol: '􀊝',
    color: 'label',
  },
  verified: {
    title: i18n.t(i18n.l.token_search.section_header.verified),
    symbol: '􀇻',
    color: 'rgba(38, 143, 255, 1)',
  },
  unverified: {
    title: i18n.t(i18n.l.token_search.section_header.unverified),
    symbol: '􀇿',
    color: 'background: rgba(255, 218, 36, 1)',
  },
  other_networks: {
    title: i18n.t(i18n.l.token_search.section_header.on_other_networks),
    symbol: 'network',
    color: 'labelTertiary',
  },
};

const bridgeSectionsColorsByChain = {
  [ChainId.mainnet]: 'mainnet' as TextStyle['color'],
  [ChainId.arbitrum]: 'arbitrum' as TextStyle['color'],
  [ChainId.optimism]: 'optimism' as TextStyle['color'],
  [ChainId.polygon]: 'polygon' as TextStyle['color'],
  [ChainId.base]: 'base' as TextStyle['color'],
  [ChainId.zora]: 'zora' as TextStyle['color'],
  [ChainId.bsc]: 'bsc' as TextStyle['color'],
  [ChainId.avalanche]: 'avalanche' as TextStyle['color'],
  [ChainId.blast]: 'blast' as TextStyle['color'],
};

const AnimatedFlashListComponent = Animated.createAnimatedComponent(FlashList<SearchAsset>);

export const TokenToBuySection = React.memo(({ sections, index }: { sections: SharedValue<AssetToBuySection[]>; index: number }) => {
  const { SwapInputController } = useSwapContext();
  const userAssets = useAssetsToSellSV();
  console.log('token buy section render');
  const section = useDerivedValue(() => sections.value[index]);
  const sectionData = useDerivedValue(() => section.value?.data);
  const sectionId = useDerivedValue(() => section.value?.id);
  const sectionSymbol = useDerivedValue(() => sectionProps[sectionId.value]?.symbol);
  const sectionTitle = useDerivedValue(() => sectionProps[sectionId.value]?.title);

  const handleSelectToken = useCallback(
    (token: SearchAsset) => {
      const userAsset = userAssets.value.find(asset => isSameAsset(asset, token));
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: token,
        userAsset,
      });
      SwapInputController.onSetAssetToBuy(parsedAsset);
    },
    [SwapInputController, userAssets.value]
  );

  const color = useDerivedValue(() => {
    if (sectionId.value !== 'bridge') {
      return sectionProps[sectionId.value]?.color as TextColor | undefined;
    }

    return bridgeSectionsColorsByChain[SwapInputController.outputChainId.value || ChainId.mainnet] as TextColor;
  });

  const animatedStyle = useAnimatedStyle(() => ({ display: section.value ? 'flex' : 'none' }));
  const animatedProps = useAnimatedProps(() => ({ testId: `${sectionId.value}-token-to-buy-section` }));

  // if (!section.data.length) return null;

  return (
    <Animated.View style={animatedStyle} animatedProps={animatedProps}>
      <Box gap={8}>
        {'section.id' === 'other_networks' ? (
          <Box borderRadius={12} height={{ custom: 52 }}>
            <Inset horizontal="20px" vertical="8px">
              <Inline space="8px" alignVertical="center">
                {/* <SwapCoinIcon  /> */}
                <Text size="icon 14px" weight="semibold" color={'labelQuaternary'}>
                  {i18n.t(i18n.l.swap.tokens_input.nothing_found)}
                </Text>
              </Inline>
            </Inset>
          </Box>
        ) : null}
        <Box paddingHorizontal={'20px'}>
          <Inline space="6px" alignVertical="center">
            <AnimatedText
              size="14px / 19px (Deprecated)"
              weight="heavy"
              // color={'section.id' === 'bridge' ? color.value : { custom: color.value }}
              color="label"
            >
              {sectionSymbol}
            </AnimatedText>
            <AnimatedText size="14px / 19px (Deprecated)" weight="heavy" color="label">
              {sectionTitle}
            </AnimatedText>
          </Inline>
        </Box>

        {/* TODO: fix this from causing the UI to be completely slow... */}
        {/* <AnimatedFlashListComponent
          data={new Array(5)}
          ListEmptyComponent={<ListEmpty />}
          keyExtractor={(item, index) => `${index}`}
          renderItem={({ item, index }) => (
            <AnimatedCoinRow sectionData={sectionData} index={index} onPress={handleSelectToken} />
            // <CoinRow
            //   key={item.uniqueId}
            //   chainId={item.chainId}
            //   color={item.colors?.primary ?? item.colors?.fallback}
            //   iconUrl={item.icon_url}
            //   address={item.address}
            //   mainnetAddress={item.mainnetAddress}
            //   balance={''}
            //   name={item.name}
            //   onPress={() => handleSelectToken(item)}
            //   nativeBalance={''}
            //   output
            //   symbol={item.symbol}
            // />
          )}
        /> */}
        <AnimatedCoinRow sectionData={sectionData} index={0} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={1} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={2} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={3} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={4} onPress={handleSelectToken} output />
      </Box>
    </Animated.View>
  );
});
