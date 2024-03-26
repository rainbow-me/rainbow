import * as i18n from '@/languages';
import React, { useCallback, useMemo } from 'react';
import { CoinRow } from '../CoinRow';
import { useSwapAssetStore } from '../../state/assets';
import { SearchAsset } from '../../types/search';
import { Box, Inline, Inset, Stack, Text } from '@/design-system';
import { TextStyle } from 'react-native';
import { AssetToBuySection, AssetToBuySectionId } from '../../hooks/useSearchCurrencyLists';
import { ChainId } from '../../types/chains';
import { BackgroundColor, TextColor } from '@/design-system/color/palettes';
import { useSwapContext } from '../../providers/swap-provider';
import { runOnUI } from 'react-native-reanimated';
import { parseSearchAsset, isSameAsset } from '../../utils/assets';

import { useAssetsToSell } from '../../hooks/useAssetsToSell';

interface SectionProp {
  backgroundColor?: BackgroundColor;
  gradient?: React.ReactNode;
  color: TextStyle['color'];
  symbol: string;
  title: string;
}

const sectionProps: { [id in AssetToBuySectionId]: SectionProp } = {
  favorites: {
    title: i18n.t(i18n.l.token_search.section_header.favorites),
    symbol: 'star.fill',
    color: 'yellow',
    gradient: undefined,
    backgroundColor: undefined,
  },
  bridge: {
    title: i18n.t(i18n.l.token_search.section_header.bridge),
    symbol: 'shuffle',
    color: 'label',
    gradient: undefined,
    backgroundColor: undefined,
  },
  verified: {
    title: i18n.t(i18n.l.token_search.section_header.verified),
    symbol: 'checkmark.seal.fill',
    color: 'labelTertiary',
    // gradient: rainbowGradient,
    backgroundColor: undefined,
  },
  unverified: {
    title: i18n.t(i18n.l.token_search.section_header.unverified),
    symbol: 'exclamationmark.triangle.fill',
    color: 'labelTertiary',
    gradient: undefined,
    backgroundColor: undefined,
  },
  other_networks: {
    title: i18n.t(i18n.l.token_search.section_header.on_other_networks),
    symbol: 'network',
    color: 'labelTertiary',
    gradient: undefined,
    backgroundColor: undefined,
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
};

export const TokenToBuySection = ({ section }: { section: AssetToBuySection }) => {
  const { SwapNavigation, SwapInputController } = useSwapContext();
  const { outputChainId, setAssetToBuy } = useSwapAssetStore();
  const userAssets = useAssetsToSell();

  const handleSelectToken = useCallback(
    (token: SearchAsset) => {
      const userAsset = userAssets.find(asset => isSameAsset(asset, token));
      const parsedAset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: token,
        userAsset,
      });

      setAssetToBuy(parsedAset);
      SwapInputController.onChangedPercentage(1);
      runOnUI(() => {
        SwapNavigation.handleOutputPress();
        SwapNavigation.handleExitSearch();
      })();
    },
    [SwapInputController, SwapNavigation, setAssetToBuy, userAssets]
  );

  const { backgroundColor, gradient, symbol, title } = sectionProps[section.id];

  const color = useMemo(() => {
    if (section.id !== 'bridge') {
      return sectionProps[section.id].color as TextColor;
    }
    return bridgeSectionsColorsByChain[outputChainId || ChainId.mainnet] as TextColor;
  }, [section.id, outputChainId]);

  if (!section.data.length) return null;

  return (
    <Box key={section.id} testID={`${section.id}-token-to-buy-section`}>
      <Stack space="20px">
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
        <Box paddingHorizontal={{ custom: 15 }}>
          <Box paddingHorizontal={{ custom: 5 }} width="full">
            <Inline space="4px" alignVertical="center">
              {/* <Symbol symbol={symbol} color={color} weight="semibold" size={14} gradient={gradient} /> */}
              <Box background={backgroundColor} style={{ width: 225 }}>
                <Text size="14px / 19px (Deprecated)" weight="semibold" color={color}>
                  {title}
                </Text>
              </Box>
            </Inline>
          </Box>
        </Box>

        {section.data.map(token => (
          <CoinRow
            key={token.uniqueId}
            chainId={token.chainId}
            color={token.colors?.primary ?? token.colors?.fallback}
            iconUrl={token.icon_url}
            mainnetAddress={token.mainnetAddress}
            address={token.address}
            balance={''}
            name={token.name}
            onPress={() => handleSelectToken(token)}
            nativeBalance={''}
            output
            symbol={token.symbol}
          />
        ))}
      </Stack>
    </Box>
  );
};
