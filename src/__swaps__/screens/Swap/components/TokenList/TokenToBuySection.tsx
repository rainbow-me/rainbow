import React, { useCallback } from 'react';
import { TextStyle } from 'react-native';
import Animated, { useDerivedValue, SharedValue, useAnimatedStyle } from 'react-native-reanimated';

import * as i18n from '@/languages';
import { SearchAsset } from '@/__swaps__/types/search';
import { AnimatedText, Box, Inline, Inset, Text, useForegroundColor } from '@/design-system';
import { AssetToBuySection, AssetToBuySectionId } from '@/__swaps__/screens/Swap/hooks/useSearchCurrencyLists';
import { ChainId } from '@/__swaps__/types/chains';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { parseSearchAsset, isSameAsset } from '@/__swaps__/utils/assets';
import { AnimatedCoinRow } from '../AnimatedCoinRow';
import { useAssetsToSellSV } from '../../hooks/useAssetsToSellSV';

interface SectionProp {
  color: TextStyle['color'];
  symbol: string;
  title: string;
}

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

// eslint-disable-next-line react/display-name
export const TokenToBuySection = React.memo(({ sections, index }: { sections: SharedValue<AssetToBuySection[]>; index: number }) => {
  const { SwapInputController } = useSwapContext();
  const userAssets = useAssetsToSellSV();

  const yellow = useForegroundColor('yellow');
  const label = useForegroundColor('label');
  const blue = useForegroundColor('blue');
  const labelTertiary = useForegroundColor('labelTertiary');

  const sectionProps: { [id in AssetToBuySectionId]: SectionProp } = {
    favorites: {
      title: i18n.t(i18n.l.token_search.section_header.favorites),
      symbol: '􀋃',
      color: yellow,
    },
    bridge: {
      title: i18n.t(i18n.l.token_search.section_header.bridge),
      symbol: '􀊝',
      color: label,
    },
    verified: {
      title: i18n.t(i18n.l.token_search.section_header.verified),
      symbol: '􀇻',
      color: blue,
    },
    unverified: {
      title: i18n.t(i18n.l.token_search.section_header.unverified),
      symbol: '􀇿',
      color: yellow,
    },
    other_networks: {
      title: i18n.t(i18n.l.token_search.section_header.on_other_networks),
      symbol: 'network',
      color: labelTertiary,
    },
  };

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

  const containerAnimatedStyle = useAnimatedStyle(() => ({ display: section.value && sectionData.value?.length ? 'flex' : 'none' }));
  const testID = useDerivedValue(() => `${sectionId.value}-token-to-buy-section`);

  const otherNetworksAnimatedStyle = useAnimatedStyle(() => ({
    display: sectionId.value === 'other_networks' ? 'flex' : 'none',
  }));

  const sectionSymbolAnimatedStyle = useAnimatedStyle(() => ({
    color:
      sectionId.value === 'bridge'
        ? bridgeSectionsColorsByChain[SwapInputController.outputChainId.value || ChainId.mainnet]
        : sectionProps[sectionId.value]?.color,
  }));

  return (
    <Animated.View style={containerAnimatedStyle} testID={testID}>
      <Box gap={8}>
        <Animated.View style={otherNetworksAnimatedStyle}>
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
        </Animated.View>
        <Box paddingHorizontal={'20px'}>
          <Inline space="6px" alignVertical="center">
            <AnimatedText size="14px / 19px (Deprecated)" weight="heavy" style={sectionSymbolAnimatedStyle}>
              {sectionSymbol}
            </AnimatedText>
            <AnimatedText size="14px / 19px (Deprecated)" weight="heavy" color="label">
              {sectionTitle}
            </AnimatedText>
          </Inline>
        </Box>
        <AnimatedCoinRow sectionData={sectionData} index={0} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={1} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={2} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={3} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={4} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={5} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={6} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={7} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={8} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={9} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={10} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={11} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={12} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={13} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={14} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={15} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={16} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={17} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={18} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={19} onPress={handleSelectToken} output />
        <AnimatedCoinRow sectionData={sectionData} index={20} onPress={handleSelectToken} output />
      </Box>
    </Animated.View>
  );
});
