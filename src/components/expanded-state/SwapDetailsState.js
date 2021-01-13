import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
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
import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';
import { useHeight } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { padding } from '@rainbow-me/styles';
import { abbreviations } from '@rainbow-me/utils';

const Footer = styled(Column).attrs({
  align: 'end',
  grow: 1,
  justify: 'end',
  shrink: 0,
})`
  ${padding(6, 0, 0)};
`;

const GasPositionContainer = styled(Row)`
  margin-horizontal: 5;
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
  useEffect(() => () => restoreFocusOnSwapModal(), [restoreFocusOnSwapModal]);
  useAndroidDisableGesturesOnFocus();

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

  const sheetHeight =
    SheetHandleFixedToTopHeight +
    SwapDetailsMastheadHeight +
    contentHeight +
    slippageMessageHeight +
    footerHeight;

  useEffect(() => {
    setParams({ longFormHeight: sheetHeight });
  }, [setParams, sheetHeight]);

  return (
    <SlackSheet
      additionalTopPadding={android}
      borderRadius={39}
      contentHeight={sheetHeight}
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
  );
}
