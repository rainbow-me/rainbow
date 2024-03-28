import MaskedView from '@react-native-masked-view/masked-view';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import Animated, { runOnUI } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { AnimatedText, Box, Column, Columns, Stack, useColorMode } from '@/design-system';
import { useTheme } from '@/theme';

import { GestureHandlerV1Button } from '../GestureHandlerV1Button';
import { SwapActionButton } from '../SwapActionButton';
import { SwapCoinIcon } from '../SwapCoinIcon';
import { FadeMask } from '../FadeMask';
import { SwapInput } from '../SwapInput';
import { BalanceBadge } from '../BalanceBadge';
import { TokenList } from '../TokenList/TokenList';
import { BASE_INPUT_WIDTH, INPUT_INNER_WIDTH, INPUT_PADDING, THICK_BORDER_WIDTH } from '../../constants';
import { IS_ANDROID } from '@/env';
import { useSwapContext } from '../../providers/swap-provider';
import { useSwapAssetStore } from '../../state/assets';
import { ethereumUtils } from '@/utils';
import { useAssetColors } from '../../hooks/useAssetColors';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useAccountSettings } from '@/hooks';
import { ChainId } from '../../types/chains';
import { useAssetsToSell } from '../../hooks/useAssetsToSell';
import { isSameAsset, parseSearchAsset } from '../../utils/assets';
import { ParsedAsset } from '../../types/assets';
import BigNumber from 'bignumber.js';
import { supportedCurrencies } from '@/references/supportedCurrencies';

function SwapInputAmount() {
  const { nativeCurrency: currentCurrency } = useAccountSettings();
  const { assetToSell } = useSwapAssetStore();
  const { focusedInput, SwapTextStyles, SwapInputController } = useSwapContext();
  const { topColor } = useAssetColors();
  const userAssets = useAssetsToSell();

  const { data: tokenDataWithPrice } = useExternalToken(
    {
      address: assetToSell ? assetToSell?.address : '',
      network: assetToSell
        ? ethereumUtils.getNetworkFromChainId(Number(assetToSell.chainId))
        : ethereumUtils.getNetworkFromChainId(ChainId.mainnet),
      currency: currentCurrency,
    },
    {
      enabled: !!assetToSell,
      refetchInterval: 5_000,
    }
  );

  const parsedAssetToSell = useMemo(() => {
    if (!assetToSell) return null;
    const userAsset = userAssets.find(userAsset => isSameAsset(userAsset, assetToSell));
    return parseSearchAsset({
      assetWithPrice: tokenDataWithPrice as unknown as ParsedAsset,
      searchAsset: assetToSell,
      userAsset,
    });
  }, [assetToSell, tokenDataWithPrice, userAssets]);

  useEffect(() => {
    if (!parsedAssetToSell) return;

    const { decimals } = supportedCurrencies[currentCurrency];

    const inputAmount = new BigNumber(parsedAssetToSell?.balance.amount || 0).toString();
    const inputNativeAmount = new BigNumber(parsedAssetToSell?.native.price?.amount || 0)
      .multipliedBy(new BigNumber(parsedAssetToSell?.balance.amount || 0))
      .toFormat(decimals);

    // TODO: Not sure if this is doing what we want...
    runOnUI((inputAmount: string, inputNativeAmount: string) => {
      'worklet';
      SwapInputController.inputValues.modify(prev => {
        return {
          ...prev,
          inputNativeAmount,
          inputAmount,
        };
      });
    })(inputAmount, inputNativeAmount);
  }, [parsedAssetToSell, SwapInputController.inputValues, currentCurrency, SwapInputController]);

  return (
    <GestureHandlerV1Button
      disableButtonPressWrapper
      onPressStartWorklet={() => {
        'worklet';
        focusedInput.value = 'inputAmount';
      }}
    >
      <MaskedView maskElement={<FadeMask fadeEdgeInset={2} fadeWidth={8} height={36} side="right" />} style={styles.inputTextMask}>
        <AnimatedText
          ellipsizeMode="clip"
          numberOfLines={1}
          size="30pt"
          style={SwapTextStyles.inputAmountTextStyle}
          text={SwapInputController.formattedInputAmount}
          weight="bold"
        />
        <Animated.View style={[styles.caretContainer, SwapTextStyles.inputCaretStyle]}>
          <Box
            borderRadius={1}
            style={[
              styles.caret,
              {
                backgroundColor: topColor,
              },
            ]}
          />
        </Animated.View>
      </MaskedView>
    </GestureHandlerV1Button>
  );
}

function SwapInputIcon() {
  const { assetToSell } = useSwapAssetStore();
  const { topColor, assetToSellShadowColor } = useAssetColors();
  const theme = useTheme();

  return (
    <Box paddingRight="10px">
      {!assetToSell ? (
        <Box
          borderRadius={18}
          height={{ custom: 36 }}
          style={[
            styles.solidColorCoinIcon,
            {
              backgroundColor: topColor,
            },
          ]}
          width={{ custom: 36 }}
        />
      ) : (
        <SwapCoinIcon
          color={assetToSellShadowColor}
          iconUrl={assetToSell.icon_url}
          address={assetToSell.address}
          large
          mainnetAddress={assetToSell.mainnetAddress}
          network={ethereumUtils.getNetworkFromChainId(assetToSell.chainId)}
          symbol={assetToSell.symbol}
          theme={theme}
        />
      )}
    </Box>
  );
}

export function SwapInputAsset() {
  const { isDarkMode } = useColorMode();
  const { topColor } = useAssetColors();

  const {
    outputProgress,
    inputProgress,
    AnimatedSwapStyles,
    SwapTextStyles,
    SwapInputController,
    SwapNavigation,
    isInputSearchFocused,
    setIsInputSearchFocused,
  } = useSwapContext();

  const { assetToSell } = useSwapAssetStore();

  return (
    <SwapInput color={topColor} otherInputProgress={outputProgress} progress={inputProgress}>
      <Box as={Animated.View} style={AnimatedSwapStyles.inputStyle}>
        <Stack space="16px">
          <Columns alignHorizontal="justify" alignVertical="center">
            <Column width="content">
              <SwapInputIcon />
            </Column>
            <SwapInputAmount />
            <Column width="content">
              <SwapActionButton
                color={topColor}
                disableShadow={isDarkMode}
                hugContent
                label={assetToSell?.symbol ?? ''}
                onPress={runOnUI(SwapNavigation.handleInputPress)}
                rightIcon={'􀆏'}
                small
              />
            </Column>
          </Columns>
          <Columns alignHorizontal="justify" alignVertical="center" space="10px">
            <AnimatedText
              numberOfLines={1}
              size="17pt"
              style={SwapTextStyles.inputNativeValueStyle}
              text={SwapInputController.formattedInputNativeValue}
              weight="heavy"
            />
            <Column width="content">
              <BalanceBadge label={assetToSell ? assetToSell.balance.display : 'No balance'} />
            </Column>
          </Columns>
        </Stack>
      </Box>
      <Box
        as={Animated.View}
        padding={{ custom: INPUT_PADDING }}
        paddingBottom={{ custom: 14.5 }}
        position="absolute"
        style={AnimatedSwapStyles.inputTokenListStyle}
        width={{ custom: INPUT_INNER_WIDTH }}
      >
        <TokenList
          color={topColor}
          handleExitSearch={runOnUI(SwapNavigation.handleExitSearch)}
          handleFocusSearch={runOnUI(SwapNavigation.handleFocusInputSearch)}
          isFocused={isInputSearchFocused}
          setIsFocused={setIsInputSearchFocused}
        />
      </Box>
    </SwapInput>
  );
}

export const styles = StyleSheet.create({
  backgroundOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
  },
  caret: {
    height: 32,
    width: 2,
  },
  caretContainer: {
    flexGrow: 100,
    flexShrink: 0,
  },
  flipButton: {
    borderRadius: 15,
    height: 30,
    width: 30,
  },
  headerButton: {
    borderRadius: 18,
    borderWidth: THICK_BORDER_WIDTH,
    height: 36,
    width: 36,
  },
  headerTextShadow: {
    padding: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  inputTextMask: { alignItems: 'center', flexDirection: 'row', height: 36, pointerEvents: 'box-only' },
  rootViewBackground: {
    backgroundColor: 'transparent',
    borderRadius: IS_ANDROID ? 20 : ScreenCornerRadius,
    flex: 1,
    overflow: 'hidden',
    marginTop: StatusBar.currentHeight ?? 0,
  },
  solidColorCoinIcon: {
    opacity: 0.4,
  },
  staticInputContainerStyles: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
  },
  staticInputStyles: {
    borderCurve: 'continuous',
    borderRadius: 30,
    borderWidth: THICK_BORDER_WIDTH,
    overflow: 'hidden',
    padding: INPUT_PADDING,
    width: BASE_INPUT_WIDTH,
  },
  textIconGlow: {
    padding: 16,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
