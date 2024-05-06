import React, { useCallback } from 'react';
import { TextStyle } from 'react-native';
import Animated, { useDerivedValue } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';

import * as i18n from '@/languages';
import { CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { SearchAsset } from '@/__swaps__/types/search';
import { AnimatedText, Box, Inline, Inset, Stack, Text } from '@/design-system';
import { AssetToBuySection, AssetToBuySectionId } from '@/__swaps__/screens/Swap/hooks/useSearchCurrencyLists';
import { ChainId } from '@/__swaps__/types/chains';
import { TextColor } from '@/design-system/color/palettes';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { parseSearchAsset } from '@/__swaps__/utils/assets';

import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { useUserAssetsStore } from '../../resources/assets/userAssets';

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

export const TokenToBuySection = ({ section }: { section: AssetToBuySection }) => {
  const { SwapInputController } = useSwapContext();
  const getUserAsset = useUserAssetsStore(state => state.getUserAsset);

  const handleSelectToken = useCallback(
    (token: SearchAsset) => {
      const userAsset = getUserAsset(token.uniqueId);
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: token,
        userAsset,
      });

      SwapInputController.onSetAssetToBuy(parsedAsset);
    },
    [SwapInputController, getUserAsset]
  );

  const { symbol, title } = sectionProps[section.id];

  const symbolValue = useDerivedValue(() => symbol);

  const color = useDerivedValue(() => {
    if (section.id !== 'bridge') {
      return sectionProps[section.id].color as TextColor;
    }

    return bridgeSectionsColorsByChain[SwapInputController.outputChainId.value || ChainId.mainnet] as TextColor;
  });

  if (!section.data.length) return null;

  return (
    <Box key={section.id} testID={`${section.id}-token-to-buy-section`}>
      <Stack space="8px">
        {section.id === 'other_networks' ? (
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
              color={section.id === 'bridge' ? color.value : { custom: color.value }}
              text={symbolValue}
            />
            <Text size="14px / 19px (Deprecated)" weight="heavy" color="label">
              {title}
            </Text>
          </Inline>
        </Box>

        {/* TODO: fix this from causing the UI to be completely slow... */}
        <AnimatedFlashListComponent
          data={section.data.slice(0, 5)}
          ListEmptyComponent={<ListEmpty />}
          keyExtractor={item => `${item.uniqueId}-${section.id}`}
          renderItem={({ item }) => (
            <CoinRow
              key={item.uniqueId}
              chainId={item.chainId}
              color={item.colors?.primary ?? item.colors?.fallback}
              iconUrl={item.icon_url}
              address={item.address}
              mainnetAddress={item.mainnetAddress}
              balance={''}
              name={item.name}
              onPress={() => handleSelectToken(item)}
              nativeBalance={''}
              output
              symbol={item.symbol}
            />
          )}
        />
      </Stack>
    </Box>
  );
};
