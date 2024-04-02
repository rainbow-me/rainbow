import MaskedView from '@react-native-masked-view/masked-view';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import Animated, { runOnUI, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
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
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useAccountSettings } from '@/hooks';
import { ChainId } from '../../types/chains';
import { useAssetsToSell } from '../../hooks/useAssetsToSell';
import { isSameAsset, isSameAssetWorklet, parseSearchAsset } from '../../utils/assets';
import { ParsedAsset } from '../../types/assets';
import BigNumber from 'bignumber.js';
import { supportedCurrencies } from '@/references/supportedCurrencies';

function SwapInputActionButton() {
  const { isDarkMode } = useColorMode();
  const { SwapNavigation, SwapInputController } = useSwapContext();

  return (
    <SwapActionButton
      color={SwapInputController.topColor}
      disableShadow={isDarkMode}
      hugContent
      label={SwapInputController.assetToSellSymbol}
      onPress={runOnUI(SwapNavigation.handleInputPress)}
      rightIcon={'􀆏'}
      small
    />
  );
}

function SwapInputAmount() {
  const { nativeCurrency: currentCurrency } = useAccountSettings();
  const { assetToSell } = useSwapAssetStore();
  const { focusedInput, SwapTextStyles, SwapInputController } = useSwapContext();
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

    const inputNativeAmount = new BigNumber(parsedAssetToSell?.native.price?.amount || 0)
      .multipliedBy(new BigNumber(parsedAssetToSell?.balance.amount || 0))
      .toFormat(decimals);

    runOnUI((inputNativeAmount: string) => {
      'worklet';
      SwapInputController.inputValues.modify(prev => {
        return {
          ...prev,
          inputNativeAmount,
        };
      });
    })(inputNativeAmount);
  }, [parsedAssetToSell, SwapInputController.inputValues, currentCurrency, SwapInputController]);

  const caretStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: SwapInputController.topColor.value,
    };
  });

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
          <Box as={Animated.View} borderRadius={1} style={[styles.caret, caretStyles]} />
        </Animated.View>
      </MaskedView>
    </GestureHandlerV1Button>
  );
}

function SwapInputIcon() {
  const { SwapInputController } = useSwapContext();
  const theme = useTheme();

  const iconStyles = useAnimatedStyle(() => {
    return {
      backgroundColor: SwapInputController.topColor.value,
    };
  });

  return (
    <Box paddingRight="10px">
      {!SwapInputController.assetToSell.value ? (
        <Box
          as={Animated.View}
          borderRadius={18}
          height={{ custom: 36 }}
          style={[styles.solidColorCoinIcon, iconStyles]}
          width={{ custom: 36 }}
        />
      ) : (
        <SwapCoinIcon
          color={SwapInputController.topColor.value}
          iconUrl={SwapInputController.assetToSell.value.icon_url}
          address={SwapInputController.assetToSell.value.address}
          large
          mainnetAddress={SwapInputController.assetToSell.value.mainnetAddress}
          network={ethereumUtils.getNetworkFromChainId(SwapInputController.assetToSell.value.chainId)}
          symbol={SwapInputController.assetToSell.value.symbol}
          theme={theme}
        />
      )}
    </Box>
  );
}

function InputAssetBalanceBadge() {
  const { SwapInputController } = useSwapContext();

  const userAssets = useAssetsToSell();

  const label = useDerivedValue(() => {
    const assetToSell = SwapInputController.assetToSell.value;
    if (!assetToSell) return 'No balance';
    const userAsset = userAssets.find(userAsset => isSameAssetWorklet(userAsset, assetToSell));
    return userAsset?.balance.display ?? 'No balance';
  });

  return <BalanceBadge label={label} />;
}

export function SwapInputAsset() {
  const { outputProgress, inputProgress, AnimatedSwapStyles, SwapTextStyles, SwapInputController, SwapNavigation } = useSwapContext();

  return (
    <SwapInput color={SwapInputController.topColor} otherInputProgress={outputProgress} progress={inputProgress}>
      <Box as={Animated.View} style={AnimatedSwapStyles.inputStyle}>
        <Stack space="16px">
          <Columns alignHorizontal="justify" alignVertical="center">
            <Column width="content">
              <SwapInputIcon />
            </Column>
            <SwapInputAmount />
            <Column width="content">
              <SwapInputActionButton />
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
              <InputAssetBalanceBadge />
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
          color={SwapInputController.topColor.value}
          handleExitSearch={runOnUI(SwapNavigation.handleExitSearch)}
          handleFocusSearch={runOnUI(SwapNavigation.handleFocusInputSearch)}
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
