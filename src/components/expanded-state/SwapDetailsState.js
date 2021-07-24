import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { ConfirmExchangeButton } from '../exchange';
import { GasSpeedButton } from '../gas';
import { Column } from '../layout';
import {
  SheetHandleFixedToTopHeight,
  SheetKeyboardAnimation,
  SheetTitle,
  SlackSheet,
} from '../sheet';
import { CopyToast, ToastPositionContainer } from '../toasts';
import {
  SwapDetailsContent,
  SwapDetailsMasthead,
  SwapDetailsMastheadHeight,
  SwapDetailsSlippageMessage,
} from './swap-details';
import { ExchangeModalTypes } from '@rainbow-me/helpers';
import {
  useAccountSettings,
  useBooleanState,
  useDimensions,
  useHeight,
  useKeyboardHeight,
  usePriceImpactDetails,
  useSwapDerivedOutputs,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { padding, position } from '@rainbow-me/styles';
import { abbreviations } from '@rainbow-me/utils';

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

const AnimatedContainer = styled(Animated.View)`
  ${position.size('100%')};
`;

const Footer = styled(Column).attrs({
  align: 'end',
  grow: 1,
  justify: 'end',
  shrink: 0,
})`
  ${padding(6, 0, 0)};
`;

const Header = styled(Column).attrs({
  justify: 'start',
})`
  left: 0;
  position: absolute;
  right: 0;
  top: -2;
  width: 100%;
`;

const FOOTER_MIN_HEIGHT = 143;
const FOOTER_CONTENT_MIN_HEIGHT = 241;

function useAndroidDisableGesturesOnFocus() {
  const { params } = useRoute();
  const isFocused = useIsFocused();
  useEffect(() => {
    android && params?.toggleGestureEnabled?.(!isFocused);
  }, [isFocused, params]);
}

function useSwapDetailsClipboardState() {
  const [copiedText, setCopiedText] = useState(undefined);
  const [copyCount, setCopyCount] = useState(0);
  const onCopySwapDetailsText = useCallback(text => {
    setCopiedText(abbreviations.formatAddressForDisplay(text));
    setCopyCount(count => count + 1);
  }, []);
  return {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  };
}

export default function SwapDetailsState({
  confirmButtonProps,
  restoreFocusOnSwapModal,
}) {
  const { network } = useAccountSettings();
  const { setParams } = useNavigation();
  const { params: { longFormHeight } = {} } = useRoute();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
  const [isKeyboardVisible, showKeyboard, hideKeyboard] = useBooleanState();
  const insets = useSafeArea();

  const {
    derivedValues: { inputAmount, outputAmount },
    displayValues: { inputAmountDisplay, outputAmountDisplay },
    tradeDetails,
  } = useSwapDerivedOutputs();
  const {
    inputPriceValue,
    isHighPriceImpact,
    outputPriceValue,
    priceImpactColor,
    priceImpactNativeAmount,
    priceImpactPercentDisplay,
  } = usePriceImpactDetails(inputAmount, outputAmount, tradeDetails);

  const {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  } = useSwapDetailsClipboardState();

  const [footerHeight, setFooterHeight] = useHeight(FOOTER_MIN_HEIGHT);
  const [slippageMessageHeight, setSlippageMessageHeight] = useHeight();
  const [contentHeight, setContentHeight] = useHeight(
    FOOTER_CONTENT_MIN_HEIGHT
  );

  useEffect(() => () => restoreFocusOnSwapModal(), [restoreFocusOnSwapModal]);
  useAndroidDisableGesturesOnFocus();

  const keyboardOffset = keyboardHeight + insets.bottom + 10;

  const sheetHeightWithoutKeyboard =
    SheetHandleFixedToTopHeight +
    SwapDetailsMastheadHeight +
    contentHeight +
    slippageMessageHeight +
    footerHeight;

  const sheetHeightWithKeyboard =
    sheetHeightWithoutKeyboard + keyboardHeight - 23;

  const additionalScrollForKeyboard =
    sheetHeightWithoutKeyboard + keyboardOffset >
    deviceHeight - insets.top + insets.bottom
      ? deviceHeight -
        insets.top +
        insets.bottom -
        (sheetHeightWithoutKeyboard + keyboardOffset)
      : 0;

  const contentScroll = useSharedValue(0);

  useEffect(() => {
    if (isKeyboardVisible) {
      contentScroll.value = withSpring(
        additionalScrollForKeyboard,
        springConfig
      );
      setParams({ longFormHeight: sheetHeightWithKeyboard });
    } else {
      contentScroll.value = withSpring(0, springConfig);
      setParams({ longFormHeight: sheetHeightWithoutKeyboard });
    }
  }, [
    additionalScrollForKeyboard,
    contentScroll,
    isKeyboardVisible,
    sheetHeightWithKeyboard,
    sheetHeightWithoutKeyboard,
    setParams,
  ]);

  return (
    <SheetKeyboardAnimation
      as={AnimatedContainer}
      isKeyboardVisible={isKeyboardVisible}
      translateY={contentScroll}
    >
      <SlackSheet
        additionalTopPadding={android}
        borderRadius={39}
        contentHeight={ios ? longFormHeight : sheetHeightWithoutKeyboard}
      >
        <Header>
          <SheetTitle weight="heavy">Review</SheetTitle>
        </Header>
        <SwapDetailsMasthead
          inputAmount={inputAmount}
          inputAmountDisplay={inputAmountDisplay}
          inputPriceValue={inputPriceValue}
          isHighPriceImpact={isHighPriceImpact}
          outputAmount={outputAmount}
          outputAmountDisplay={outputAmountDisplay}
          outputPriceValue={outputPriceValue}
          priceImpactColor={priceImpactColor}
        />
        <SwapDetailsSlippageMessage
          isHighPriceImpact={isHighPriceImpact}
          onLayout={setSlippageMessageHeight}
          priceImpactColor={priceImpactColor}
          priceImpactNativeAmount={priceImpactNativeAmount}
          priceImpactPercentDisplay={priceImpactPercentDisplay}
        />
        <SwapDetailsContent
          isHighPriceImpact={isHighPriceImpact}
          onCopySwapDetailsText={onCopySwapDetailsText}
          onLayout={setContentHeight}
          priceImpactColor={priceImpactColor}
          priceImpactNativeAmount={priceImpactNativeAmount}
          priceImpactPercentDisplay={priceImpactPercentDisplay}
          tradeDetails={tradeDetails}
        />
        <Footer onLayout={setFooterHeight}>
          <ConfirmExchangeButton
            {...confirmButtonProps}
            testID="swap-details-confirm-button"
          />
          <Column
            justify="center"
            marginHorizontal={5}
            width={deviceWidth - 10}
          >
            <GasSpeedButton
              currentNetwork={network}
              onCustomGasBlur={hideKeyboard}
              onCustomGasFocus={showKeyboard}
              testID="swap-details-gas"
              theme="light"
              type={ExchangeModalTypes.swap}
            />
          </Column>
        </Footer>
        <ToastPositionContainer>
          <CopyToast copiedText={copiedText} copyCount={copyCount} />
        </ToastPositionContainer>
      </SlackSheet>
    </SheetKeyboardAnimation>
  );
}
