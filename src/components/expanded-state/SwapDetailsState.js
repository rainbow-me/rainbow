import { useIsFocused, useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
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
import {
  useAccountSettings,
  useHeight,
  usePriceImpactDetails,
  useSwapCurrencies,
  useSwapDerivedOutputs,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import styled from '@rainbow-me/styled-components';
import { padding, position } from '@rainbow-me/styles';
import { abbreviations } from '@rainbow-me/utils';

const springConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

const AnimatedContainer = styled(Animated.View)({
  ...position.sizeAsObject('100%'),
});

const Footer = styled(Column).attrs({
  align: 'end',
  grow: 1,
  justify: 'end',
  shrink: 0,
})({
  ...padding.object(6, 0, 0),
});

const Header = styled(Column).attrs({
  justify: 'start',
})({
  left: 0,
  position: 'absolute',
  right: 0,
  top: -2,
  width: '100%',
});

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
  const { outputCurrency } = useSwapCurrencies();

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

  const sheetHeightWithoutKeyboard =
    SheetHandleFixedToTopHeight +
    SwapDetailsMastheadHeight +
    contentHeight +
    slippageMessageHeight +
    footerHeight;

  const contentScroll = useSharedValue(0);

  useEffect(() => {
    contentScroll.value = withSpring(0, springConfig);
    setParams({ longFormHeight: sheetHeightWithoutKeyboard });
  }, [contentScroll, sheetHeightWithoutKeyboard, setParams]);

  return (
    <SheetKeyboardAnimation
      as={AnimatedContainer}
      isKeyboardVisible={false}
      translateY={contentScroll}
    >
      <SlackSheet
        additionalTopPadding={android}
        borderRadius={39}
        contentHeight={ios ? longFormHeight : sheetHeightWithoutKeyboard}
      >
        <Header>
          <SheetTitle weight="heavy">
            {lang.t('expanded_state.swap_details.review')}
          </SheetTitle>
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
          <GasSpeedButton
            asset={outputCurrency}
            currentNetwork={network}
            testID="swap-details-gas"
            theme="light"
          />
        </Footer>
        <ToastPositionContainer>
          <CopyToast copiedText={copiedText} copyCount={copyCount} />
        </ToastPositionContainer>
      </SlackSheet>
    </SheetKeyboardAnimation>
  );
}
