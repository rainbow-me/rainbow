import c from 'chroma-js';
import React, { useCallback, useMemo } from 'react';
import { Text as RNText, StyleSheet } from 'react-native';
import * as i18n from '@/languages';
import { CoinRow } from '../CoinRow';
import { useAssetsToSell } from '../../hooks/useAssetsToSell';
import { ParsedSearchAsset } from '../../types/assets';
import { Box, Stack, Text, Inline, Bleed, useColorMode, globalColors, HitSlop } from '@/design-system';
import { runOnUI } from 'react-native-reanimated';
import { useSwapContext } from '../../providers/swap-provider';
import { parseSearchAsset, isSameAsset } from '../../utils/assets';
import { opacity } from '../../utils/swaps';
import { useAccountAccentColor } from '@/hooks';
import { ButtonPressAnimation } from '@/components/animations';
import { ETH_COLOR, ETH_COLOR_DARK } from '../../constants';

export const TokenToSellList = () => {
  const { accentColor: accountColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();
  const { SwapNavigation, SwapInputController } = useSwapContext();
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

      // we need to update the inputNativeValue to the user balance / native value
      runOnUI((parsedAsset: ParsedSearchAsset) => {
        SwapInputController.inputValues.modify(prev => ({
          ...prev,
          inputNativeValue: parsedAsset.native.balance.amount,
          inputUserBalance: parsedAsset.balance.amount ?? '0',
          inputSymbol: parsedAsset.symbol,
          inputIconUrl: parsedAsset.icon_url,
          inputTokenColor: parsedAsset.colors?.primary ?? parsedAsset.colors?.fallback ?? (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR),
          inputTokenShadowColor: parsedAsset.colors?.shadow ?? (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR),
          inputChainId: parsedAsset.chainId,
          inputAddress: parsedAsset.address,
        }));

        SwapNavigation.handleOutputPress();
      })(parsedAsset);
    },
    [SwapInputController.inputValues, SwapNavigation, isDarkMode, userAssets]
  );

  const assetsCount = useMemo(
    () =>
      userAssets?.reduce((prev, asset) => {
        let count = prev;
        if (asset) {
          count += 1;
        }

        return count;
      }, 0),
    [userAssets]
  );

  return (
    <Stack space="20px">
      <Stack space="20px">
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
      </Stack>
      {userAssets.map((token: ParsedSearchAsset) => (
        <CoinRow
          key={token.uniqueId}
          chainId={token.chainId}
          color={token.colors?.primary ?? token.colors?.fallback}
          iconUrl={token.icon_url}
          address={token.address}
          mainnetAddress={token.mainnetAddress}
          balance={token.balance.display}
          name={token.name}
          onPress={() => handleSelectToken(token)}
          nativeBalance={token.native.balance.display}
          output={false}
          symbol={token.symbol}
        />
      ))}

      {!assetsCount && (
        <Box alignItems="center" style={{ paddingTop: 121 }}>
          <Box paddingHorizontal="36px">
            <Stack space="16px">
              <Text color="label" size="26pt" weight="bold" align="center">
                {'👻'}
              </Text>

              <Text color="labelTertiary" size="20pt" weight="semibold" align="center">
                {i18n.t(i18n.l.swap.tokens_input.nothing_found)}
              </Text>

              <Text color="labelQuaternary" size="14px / 19px (Deprecated)" weight="regular" align="center">
                {i18n.t(i18n.l.swap.tokens_input.nothing_found_description, {
                  action: 'swap',
                })}
              </Text>
            </Stack>
          </Box>
        </Box>
      )}
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
