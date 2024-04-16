import c from 'chroma-js';
import React, { useCallback, useMemo } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import { CoinRow } from '@/__swaps__/screens/Swap/components/CoinRow';
import { useAssetsToSell } from '@/__swaps__/screens/Swap/hooks/useAssetsToSell';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { Box, Stack, Text, Inline, Bleed, useColorMode, globalColors, HitSlop } from '@/design-system';
import Animated, { runOnUI } from 'react-native-reanimated';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { parseSearchAsset, isSameAsset } from '@/__swaps__/utils/assets';
import { opacity } from '@/__swaps__/utils/swaps';
import { useAccountAccentColor } from '@/hooks';
import { ButtonPressAnimation } from '@/components/animations';
import { ListEmpty } from '@/__swaps__/screens/Swap/components/TokenList/ListEmpty';
import { FlashList } from '@shopify/flash-list';
import { TokenColors } from '@/graphql/__generated__/metadata';

const AnimatedFlashListComponent = Animated.createAnimatedComponent(FlashList<ParsedSearchAsset>);

export const TokenToSellList = () => {
  const { accentColor: accountColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();
  const { SwapInputController } = useSwapContext();
  const userAssets = useAssetsToSell();

  const accentColor = useMemo(() => {
    if (c.contrast(accountColor, isDarkMode ? '#191A1C' : globalColors.white100) < (isDarkMode ? 2.125 : 1.5)) {
      const shiftedColor = isDarkMode ? c(accountColor).brighten(1).saturate(0.5).css() : c(accountColor).darken(0.5).saturate(0.5).css();
      return shiftedColor;
    } else {
      return accountColor;
    }
  }, [accountColor, isDarkMode]);

  const handleSelectToken = useCallback(
    (token: ParsedSearchAsset) => {
      const userAsset = userAssets.find(asset => isSameAsset(asset, token));
      const parsedAsset = parseSearchAsset({
        assetWithPrice: undefined,
        searchAsset: token,
        userAsset,
      });

      runOnUI(SwapInputController.onSetAssetToSell)(parsedAsset);
    },
    [SwapInputController.onSetAssetToSell, userAssets]
  );

  return (
    <Stack space="20px">
      <Box paddingHorizontal={'20px'}>
        <Inline alignHorizontal="justify" alignVertical="center">
          <Inline alignVertical="center" space="6px">
            <Bleed vertical="4px">
              <Box alignItems="center" justifyContent="center" width={{ custom: 18 }}>
                <Bleed space={isDarkMode ? '16px' : undefined}>
                  <RNText
                    style={
                      isDarkMode
                        ? [
                            styles.textIconGlow,
                            {
                              textShadowColor: opacity(accentColor, 0.2),
                            },
                          ]
                        : undefined
                    }
                  >
                    <Text align="center" color={{ custom: accentColor }} size="icon 13px" weight="black">
                      􀣽
                    </Text>
                  </RNText>
                </Bleed>
              </Box>
            </Bleed>
            <Text color="label" size="15pt" weight="heavy">
              My tokens
            </Text>
          </Inline>
          <ButtonPressAnimation>
            <HitSlop space="10px">
              <Inline alignVertical="center" space="6px" wrap={false}>
                <Text align="right" color={isDarkMode ? 'labelSecondary' : 'label'} size="15pt" weight="heavy">
                  All Networks
                </Text>
                <Text align="center" color={isDarkMode ? 'labelTertiary' : 'labelSecondary'} size="icon 13px" weight="bold">
                  􀆏
                </Text>
              </Inline>
            </HitSlop>
          </ButtonPressAnimation>
        </Inline>
      </Box>
      <AnimatedFlashListComponent
        data={userAssets}
        ListEmptyComponent={<ListEmpty />}
        keyExtractor={item => item.uniqueId}
        renderItem={({ item }) => (
          <CoinRow
            key={item.uniqueId}
            chainId={item.chainId}
            colors={item.colors as TokenColors}
            iconUrl={item.icon_url}
            address={item.address}
            balance={item.balance.display}
            name={item.name}
            onPress={() => handleSelectToken(item)}
            nativeBalance={item.native.balance.display}
            output={false}
            symbol={item.symbol}
          />
        )}
      />
    </Stack>
  );
};

export const styles = StyleSheet.create({
  textIconGlow: {
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
