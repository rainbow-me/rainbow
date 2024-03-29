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
import { isSameAsset, parseSearchAsset } from '../../utils/assets';
import { useAssetsToSell } from '../../hooks/useAssetsToSell';
import { useAccountSettings } from '@/hooks';
import { useExternalToken } from '../../../../../resources/assets/externalAssetsQuery';
import { ParsedAsset } from '../../types/assets';
import BigNumber from 'bignumber.js';
import { supportedCurrencies } from '@/references/supportedCurrencies';

function SwapOutputActionButton() {
  const { isDarkMode } = useColorMode();
  const { SwapNavigation, SwapInputController } = useSwapContext();
  const { assetToBuy } = useSwapAssetStore();

  return (
    <SwapActionButton
      color={SwapInputController.inputValues.value.outputTokenColor}
      disableShadow={isDarkMode}
      hugContent
      label={assetToBuy?.symbol ?? ''}
      onPress={runOnUI(SwapNavigation.handleOutputPress)}
      rightIcon={'􀆏'}
      small
    />
  );
}

function SwapOutputAmount() {
  const { nativeCurrency: currentCurrency } = useAccountSettings();
  const { assetToBuy, outputChainId } = useSwapAssetStore();
  const { focusedInput, SwapTextStyles, SwapInputController } = useSwapContext();
  const userAssets = useAssetsToSell();

  const { data: tokenDataWithPrice } = useExternalToken(
    {
      address: assetToBuy ? assetToBuy?.address : '',
      network: ethereumUtils.getNetworkFromChainId(outputChainId),
      currency: currentCurrency,
    },
    {
      enabled: !!assetToBuy,
    }
  );

  const parsedAssetToBuy = useMemo(() => {
    if (!assetToBuy) return null;
    const userAsset = userAssets.find(userAsset => isSameAsset(userAsset, assetToBuy));
    return parseSearchAsset({
      assetWithPrice: tokenDataWithPrice as unknown as ParsedAsset,
      searchAsset: assetToBuy,
      userAsset,
    });
  }, [assetToBuy, tokenDataWithPrice, userAssets]);

  useEffect(() => {
    if (!parsedAssetToBuy) return;

    const { decimals } = supportedCurrencies[currentCurrency];

    const outputNativeAmount = new BigNumber(parsedAssetToBuy?.native.price?.amount || 0)
      .multipliedBy(new BigNumber(parsedAssetToBuy?.balance.amount || 0))
      .toFormat(decimals);

    runOnUI((outputNativeAmount: string) => {
      'worklet';
      SwapInputController.inputValues.modify(prev => {
        return {
          ...prev,
          outputNativeAmount,
        };
      });
    })(outputNativeAmount);
  }, [parsedAssetToBuy, SwapInputController.inputValues, currentCurrency, SwapInputController]);

  return (
    <GestureHandlerV1Button
      disableButtonPressWrapper
      onPressStartWorklet={() => {
        'worklet';
        focusedInput.value = 'outputAmount';
      }}
    >
      <MaskedView maskElement={<FadeMask fadeEdgeInset={2} fadeWidth={8} height={36} side="right" />} style={styles.inputTextMask}>
        <AnimatedText
          ellipsizeMode="clip"
          numberOfLines={1}
          size="30pt"
          style={SwapTextStyles.outputAmountTextStyle}
          text={SwapInputController.formattedOutputAmount}
          weight="bold"
        />
        <Animated.View style={[styles.caretContainer, SwapTextStyles.outputCaretStyle]}>
          <Box
            borderRadius={1}
            style={[
              styles.caret,
              {
                backgroundColor: SwapInputController.inputValues.value.outputTokenColor.toString(),
              },
            ]}
          />
        </Animated.View>
      </MaskedView>
    </GestureHandlerV1Button>
  );
}

function SwapInputIcon() {
  const { SwapInputController } = useSwapContext();
  const { assetToBuy } = useSwapAssetStore();
  const theme = useTheme();

  return (
    <Box paddingRight="10px">
      {!assetToBuy ? (
        <Box
          borderRadius={18}
          height={{ custom: 36 }}
          style={[
            styles.solidColorCoinIcon,
            {
              backgroundColor: SwapInputController.inputValues.value.outputTokenColor.toString(),
            },
          ]}
          width={{ custom: 36 }}
        />
      ) : (
        <SwapCoinIcon
          color={SwapInputController.inputValues.value.outputTokenShadowColor.toString()}
          iconUrl={assetToBuy.icon_url}
          address={assetToBuy.address}
          large
          mainnetAddress={assetToBuy.mainnetAddress}
          network={ethereumUtils.getNetworkFromChainId(assetToBuy.chainId)}
          symbol={assetToBuy.symbol}
          theme={theme}
        />
      )}
    </Box>
  );
}

function OutputAssetBalanceBadge() {
  const { nativeCurrency: currentCurrency } = useAccountSettings();
  const { assetToBuy, outputChainId } = useSwapAssetStore();

  const userAssets = useAssetsToSell();

  const { data: tokenDataWithPrice } = useExternalToken(
    {
      address: assetToBuy ? assetToBuy?.address : '',
      network: ethereumUtils.getNetworkFromChainId(outputChainId),
      currency: currentCurrency,
    },
    {
      enabled: !!assetToBuy,
    }
  );

  const parsedAssetToBuy = useMemo(() => {
    if (!assetToBuy) return null;
    const userAsset = userAssets.find(userAsset => isSameAsset(userAsset, assetToBuy));
    return parseSearchAsset({
      assetWithPrice: tokenDataWithPrice as unknown as ParsedAsset,
      searchAsset: assetToBuy,
      userAsset,
    });
  }, [assetToBuy, tokenDataWithPrice, userAssets]);

  return <BalanceBadge label={parsedAssetToBuy?.balance.display ?? 'No balance'} />;
}

export function SwapOutputAsset() {
  const { outputProgress, inputProgress, AnimatedSwapStyles, SwapTextStyles, SwapInputController, SwapNavigation } = useSwapContext();

  return (
    <SwapInput
      bottomInput
      color={SwapInputController.inputValues.value.outputTokenColor}
      otherInputProgress={inputProgress}
      progress={outputProgress}
    >
      <Box as={Animated.View} style={AnimatedSwapStyles.outputStyle}>
        <Stack space="16px">
          <Columns alignHorizontal="justify" alignVertical="center">
            <Column width="content">
              <SwapInputIcon />
            </Column>
            <SwapOutputAmount />
            <Column width="content">
              <SwapOutputActionButton />
            </Column>
          </Columns>
          <Columns alignHorizontal="justify" alignVertical="center" space="10px">
            <AnimatedText
              numberOfLines={1}
              size="17pt"
              style={SwapTextStyles.outputNativeValueStyle}
              text={SwapInputController.formattedOutputNativeValue}
              weight="heavy"
            />
            <Column width="content">
              <OutputAssetBalanceBadge />
            </Column>
          </Columns>
        </Stack>
      </Box>
      <Box
        as={Animated.View}
        height="full"
        padding={{ custom: INPUT_PADDING }}
        paddingBottom={{ custom: 14.5 }}
        position="absolute"
        style={AnimatedSwapStyles.outputTokenListStyle}
        width={{ custom: INPUT_INNER_WIDTH }}
      >
        <TokenList
          color={SwapInputController.inputValues.value.outputTokenColor.toString()}
          handleExitSearch={runOnUI(SwapNavigation.handleExitSearch)}
          handleFocusSearch={runOnUI(SwapNavigation.handleFocusOutputSearch)}
          output
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
