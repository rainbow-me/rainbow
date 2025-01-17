import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import Animated, { useDerivedValue } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { AnimatedText, Box, Column, Columns, Stack, useColorMode } from '@/design-system';

import { BalanceBadge } from '@/__swaps__/screens/Swap/components/BalanceBadge';
import { FadeMask } from '@/__swaps__/screens/Swap/components/FadeMask';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { SwapActionButton } from '@/__swaps__/screens/Swap/components/SwapActionButton';
import { SwapInput } from '@/__swaps__/screens/Swap/components/SwapInput';
import { SwapNativeInput } from '@/__swaps__/screens/Swap/components/SwapNativeInput';
import { SwapInputValuesCaret } from '@/__swaps__/screens/Swap/components/SwapInputValuesCaret';
import { TokenList } from '@/__swaps__/screens/Swap/components/TokenList/TokenList';
import { BASE_INPUT_WIDTH, INPUT_INNER_WIDTH, INPUT_PADDING, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { IS_ANDROID, IS_IOS } from '@/env';
import * as i18n from '@/languages';

import Clipboard from '@react-native-clipboard/clipboard';
import { AnimatedSwapCoinIcon } from './AnimatedSwapCoinIcon';
import { CopyPasteMenu } from './CopyPasteMenu';

const SELECT_LABEL = i18n.t(i18n.l.swap.select);
const NO_BALANCE_LABEL = i18n.t(i18n.l.swap.no_balance);
const TOKEN_TO_SWAP_LABEL = i18n.t(i18n.l.swap.token_to_swap);

function SwapInputActionButton() {
  const { isDarkMode } = useColorMode();
  const { SwapNavigation, internalSelectedInputAsset } = useSwapContext();

  const label = useDerivedValue(() => {
    const asset = internalSelectedInputAsset.value;
    return asset?.symbol ?? (!asset ? SELECT_LABEL : '');
  });

  return (
    <SwapActionButton
      testID="swap-input-asset-action-button"
      asset={internalSelectedInputAsset}
      disableShadow={isDarkMode}
      hugContent
      label={label}
      onPressWorklet={SwapNavigation.handleInputPress}
      rightIcon={'􀆏'}
      small
    />
  );
}

function SwapInputAmount() {
  const { focusedInput, SwapTextStyles, SwapInputController } = useSwapContext();

  return (
    <CopyPasteMenu
      onCopy={() => Clipboard.setString(SwapInputController.formattedInputAmount.value)}
      onPaste={text => {
        const numericValue = text && +text.replaceAll(',', '');
        if (!numericValue) return;
        SwapInputController.inputMethod.value = 'inputAmount';
        SwapInputController.inputValues.modify(values => {
          'worklet';
          return { ...values, inputAmount: numericValue };
        });
      }}
    >
      <GestureHandlerButton
        disableHaptics
        disableScale
        onPressWorklet={() => {
          'worklet';
          focusedInput.value = 'inputAmount';
        }}
      >
        <MaskedView maskElement={<FadeMask fadeEdgeInset={2} fadeWidth={8} height={36} side="right" />} style={styles.inputTextMask}>
          <AnimatedText
            testID={'swap-asset-amount'}
            ellipsizeMode="clip"
            numberOfLines={1}
            size="30pt"
            style={SwapTextStyles.inputAmountTextStyle}
            weight="bold"
          >
            {SwapInputController.formattedInputAmount}
          </AnimatedText>
          <SwapInputValuesCaret inputCaretType="inputAmount" />
        </MaskedView>
      </GestureHandlerButton>
    </CopyPasteMenu>
  );
}

function SwapInputIcon() {
  return (
    <Box paddingRight="10px">
      <AnimatedSwapCoinIcon assetType="input" size={36} chainSize={16} />
    </Box>
  );
}

function InputAssetBalanceBadge() {
  const { internalSelectedInputAsset, SwapInputController } = useSwapContext();

  const label = useDerivedValue(() => {
    const asset = internalSelectedInputAsset.value;
    const hasBalance = Number(asset?.balance.amount) > 0 && asset?.balance.display;
    const balance = (hasBalance && asset?.balance.display) || NO_BALANCE_LABEL;

    return asset ? balance : TOKEN_TO_SWAP_LABEL;
  });

  return (
    <GestureHandlerButton onPressWorklet={SwapInputController.setValueToMaxSwappableAmount}>
      <BalanceBadge label={label} />
    </GestureHandlerButton>
  );
}

export function SwapInputAsset() {
  const { outputProgress, inputProgress, AnimatedSwapStyles, internalSelectedInputAsset, SwapNavigation } = useSwapContext();

  return (
    <SwapInput asset={internalSelectedInputAsset} otherInputProgress={outputProgress} progress={inputProgress}>
      <Box testID={'swap-asset-input'} as={Animated.View} style={AnimatedSwapStyles.inputStyle}>
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
            <SwapNativeInput nativeInputType="inputNativeValue" />
            <Column width="content">
              <InputAssetBalanceBadge />
            </Column>
          </Columns>
        </Stack>
      </Box>
      <Box
        as={Animated.View}
        paddingTop={{ custom: INPUT_PADDING }}
        paddingBottom={{ custom: 14.5 }}
        position="absolute"
        style={AnimatedSwapStyles.inputTokenListStyle}
        width={{ custom: INPUT_INNER_WIDTH }}
      >
        <TokenList
          handleExitSearchWorklet={SwapNavigation.handleExitSearch}
          handleFocusSearchWorklet={SwapNavigation.handleFocusInputSearch}
          output={false}
        />
      </Box>
    </SwapInput>
  );
}

export const styles = StyleSheet.create({
  backgroundOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
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
  staticInputContainerStyles: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
  },
  staticInputStyles: {
    borderCurve: 'continuous',
    borderRadius: 30,
    borderWidth: IS_IOS ? THICK_BORDER_WIDTH : 0,
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
