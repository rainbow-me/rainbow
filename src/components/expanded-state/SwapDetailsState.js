import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { GasSpeedButton } from '../gas';
import { Column, Row } from '../layout';
import { SheetHandleFixedToTopHeight, SheetTitle, SlackSheet } from '../sheet';
import { CopyToast, ToastPositionContainer } from '../toasts';
import {
  SwapDetailsContent,
  SwapDetailsContentMinHeight,
  SwapDetailsMasthead,
  SwapDetailsMastheadHeight,
  SwapDetailsSlippageMessage,
} from './swap-details';
import { isReanimatedAvailable } from '@rainbow-me/helpers';
import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';
import { useDimensions, useHeight, useKeyboardHeight } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { margin, padding } from '@rainbow-me/styles';
import { abbreviations, safeAreaInsetValues } from '@rainbow-me/utils';

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

const AnimatedContainer = styled(Animated.View)`
  height: 100%;
  width: 100%;
`;

const Footer = styled(Column).attrs({
  align: 'end',
  grow: 1,
  justify: 'end',
  shrink: 0,
})`
  ${padding(6, 0, 0)};
`;

const GasPositionContainer = styled(Row)`
  ${margin(0, 5)};
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
  renderConfirmButton,
  restoreFocusOnSwapModal,
}) {
  const { setParams } = useNavigation();
  const { params: { longFormHeight } = {} } = useRoute();
  useEffect(() => () => restoreFocusOnSwapModal(), [restoreFocusOnSwapModal]);
  useAndroidDisableGesturesOnFocus();
  const { height: deviceHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  } = useSwapDetailsClipboardState();

  const [footerHeight, setFooterHeight] = useHeight();
  const [slippageMessageHeight, setSlippageMessageHeight] = useHeight();
  const [contentHeight, setContentHeight] = useHeight(
    SwapDetailsContentMinHeight
  );

  const keyboardOffset =
    keyboardHeight + safeAreaInsetValues.bottom + (android ? 50 : 10);

  const sheetHeightWithKeyboard =
    SheetHandleFixedToTopHeight +
    SwapDetailsMastheadHeight +
    contentHeight +
    footerHeight +
    keyboardHeight -
    23;

  const sheetHeightWithoutKeyboard =
    SheetHandleFixedToTopHeight +
    SwapDetailsMastheadHeight +
    contentHeight +
    slippageMessageHeight +
    footerHeight;

  const additionalScrollForKeyboard =
    sheetHeightWithoutKeyboard + keyboardOffset >
    deviceHeight - safeAreaInsetValues.top + safeAreaInsetValues.bottom
      ? deviceHeight -
        safeAreaInsetValues.top +
        safeAreaInsetValues.bottom -
        (sheetHeightWithoutKeyboard + keyboardOffset)
      : 0;

  const handleCustomGasFocus = useCallback(() => {
    setKeyboardVisible(true);
  }, []);
  const handleCustomGasBlur = useCallback(() => {
    setKeyboardVisible(false);
  }, []);

  const contentScroll = useSharedValue(0);
  const animatedContainerStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: contentScroll.value }],
    };
  });
  const fallbackStyles = {
    marginBottom: keyboardVisible ? keyboardHeight : 0,
  };

  useEffect(() => {
    if (keyboardVisible) {
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
    keyboardVisible,
    sheetHeightWithKeyboard,
    sheetHeightWithoutKeyboard,
    setParams,
  ]);

  return (
    <AnimatedContainer
      style={isReanimatedAvailable ? animatedContainerStyles : fallbackStyles}
    >
      <SlackSheet
        additionalTopPadding={android}
        borderRadius={39}
        contentHeight={longFormHeight}
      >
        <Header>
          <SheetTitle weight="heavy">Review</SheetTitle>
        </Header>
        <SwapDetailsMasthead />
        <SwapDetailsSlippageMessage onLayout={setSlippageMessageHeight} />
        <SwapDetailsContent
          onCopySwapDetailsText={onCopySwapDetailsText}
          onLayout={setContentHeight}
        />
        <Footer onLayout={setFooterHeight}>
          {renderConfirmButton}
          <GasPositionContainer>
            <GasSpeedButton
              onCustomGasBlur={handleCustomGasBlur}
              onCustomGasFocus={handleCustomGasFocus}
              testID="swap-details-gas"
              theme="light"
              type={ExchangeModalTypes.swap}
            />
          </GasPositionContainer>
        </Footer>
        <ToastPositionContainer>
          <CopyToast copiedText={copiedText} copyCount={copyCount} />
        </ToastPositionContainer>
      </SlackSheet>
    </AnimatedContainer>
  );
}
