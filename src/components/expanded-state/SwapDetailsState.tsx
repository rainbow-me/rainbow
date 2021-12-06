import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import Animated, { useSharedValue, withSpring } from 'react-native-reanimated';
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
import {
  useAccountSettings,
  useHeight,
  usePriceImpactDetails,
  useSwapCurrencies,
  useSwapDerivedOutputs,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
}: any) {
  const { network } = useAccountSettings();
  const { setParams } = useNavigation();
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'longFormHeight' does not exist on type '... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <SheetKeyboardAnimation
      as={AnimatedContainer}
      isKeyboardVisible={false}
      translateY={contentScroll}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SlackSheet
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        additionalTopPadding={android}
        borderRadius={39}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        contentHeight={ios ? longFormHeight : sheetHeightWithoutKeyboard}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Header>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetTitle weight="heavy">Review</SheetTitle>
        </Header>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SwapDetailsSlippageMessage
          isHighPriceImpact={isHighPriceImpact}
          onLayout={setSlippageMessageHeight}
          priceImpactColor={priceImpactColor}
          priceImpactNativeAmount={priceImpactNativeAmount}
          priceImpactPercentDisplay={priceImpactPercentDisplay}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <SwapDetailsContent
          isHighPriceImpact={isHighPriceImpact}
          onCopySwapDetailsText={onCopySwapDetailsText}
          onLayout={setContentHeight}
          priceImpactColor={priceImpactColor}
          priceImpactNativeAmount={priceImpactNativeAmount}
          priceImpactPercentDisplay={priceImpactPercentDisplay}
          tradeDetails={tradeDetails}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Footer onLayout={setFooterHeight}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ConfirmExchangeButton
            {...confirmButtonProps}
            testID="swap-details-confirm-button"
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <GasSpeedButton
            asset={outputCurrency}
            currentNetwork={network}
            testID="swap-details-gas"
            theme="light"
          />
        </Footer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ToastPositionContainer>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <CopyToast copiedText={copiedText} copyCount={copyCount} />
        </ToastPositionContainer>
      </SlackSheet>
    </SheetKeyboardAnimation>
  );
}
