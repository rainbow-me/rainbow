import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components/primitives';
import { GasSpeedButton } from '../gas';
import { Column, ColumnWithMargins } from '../layout';
import { SheetHandleFixedToTopHeight, SheetTitle, SlackSheet } from '../sheet';
import { CopyToast, ToastPositionContainer } from '../toasts';
import {
  SwapDetailsContractRow,
  SwapDetailsMasthead,
  SwapDetailsMastheadHeight,
  SwapDetailsPriceRow,
  SwapDetailsRow,
  SwapDetailsRowHeight,
  SwapDetailsUniswapRow,
  SwapDetailsValue,
} from './swap-details';
import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';
import { convertBipsToPercentage } from '@rainbow-me/helpers/utilities';
import { useHeight } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { colors, padding } from '@rainbow-me/styles';
import { abbreviations, isETH } from '@rainbow-me/utils';

const contentRowMargin = 24;
const contentRowHeight = SwapDetailsRowHeight + contentRowMargin;
const Content = styled(ColumnWithMargins).attrs({
  flex: 1,
  margin: contentRowMargin,
})`
  ${padding(30, 19)};
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
  inputCurrency,
  outputCurrency,
  renderConfirmButton,
  restoreFocusOnSwapModal,
  slippage,
}) {
  const { setParams } = useNavigation();
  useEffect(() => () => restoreFocusOnSwapModal(), [restoreFocusOnSwapModal]);
  useAndroidDisableGesturesOnFocus();

  const {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  } = useSwapDetailsClipboardState();

  const [contentHeight, setContentHeight] = useHeight(contentRowHeight * 4);
  const [footerHeight, setFooterHeight] = useHeight();

  const sheetHeight =
    SheetHandleFixedToTopHeight +
    SwapDetailsMastheadHeight +
    contentHeight +
    footerHeight;

  useEffect(() => {
    setParams({ longFormHeight: sheetHeight });
  }, [setParams, sheetHeight]);

  return (
    <SlackSheet additionalTopPadding={android} contentHeight={sheetHeight}>
      <Header>
        <SheetTitle weight="heavy">Review</SheetTitle>
      </Header>
      <SwapDetailsMasthead />
      <Content onLayout={setContentHeight} testID="swap-details-state">
        <SwapDetailsRow label="Price impact">
          <SwapDetailsValue color={colors.green} letterSpacing="roundedTight">
            {`${convertBipsToPercentage(slippage, 1)}%`}
          </SwapDetailsValue>
        </SwapDetailsRow>
        <SwapDetailsPriceRow />
        {!isETH(inputCurrency?.address) && (
          <SwapDetailsContractRow
            asset={inputCurrency}
            onCopySwapDetailsText={onCopySwapDetailsText}
          />
        )}
        {!isETH(outputCurrency?.address) && (
          <SwapDetailsContractRow
            asset={outputCurrency}
            onCopySwapDetailsText={onCopySwapDetailsText}
          />
        )}
        <SwapDetailsUniswapRow />
      </Content>
      <Footer onLayout={setFooterHeight}>
        {renderConfirmButton}
        <GasSpeedButton
          testID="swap-details-gas"
          theme="light"
          type={ExchangeModalTypes.swap}
        />
      </Footer>
      <ToastPositionContainer>
        <CopyToast copiedText={copiedText} copyCount={copyCount} />
      </ToastPositionContainer>
    </SlackSheet>
  );
}
