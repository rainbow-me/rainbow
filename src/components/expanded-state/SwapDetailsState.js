import { useIsFocused, useRoute } from '@react-navigation/native';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import styled from 'styled-components/primitives';
import {
  // ConfirmExchangeButton,
  SlippageWarningThresholdInBips,
} from '../exchange';
// import { GasSpeedButton } from '../gas';
import { Centered, ColumnWithMargins } from '../layout';
import { SheetTitle, SlackSheet } from '../sheet';
import { CopyToast, ToastPositionContainer } from '../toasts';
import {
  SwapDetailsContext,
  SwapDetailsContractRow,
  SwapDetailsMasthead,
  SwapDetailsPriceRow,
  SwapDetailsRow,
  SwapDetailsUniswapRow,
  SwapDetailsValue,
} from './swap-details';
// import ExchangeModalTypes from '@rainbow-me/helpers/exchangeModalTypes';
import { colors, padding } from '@rainbow-me/styles';
import { abbreviations, isETH } from '@rainbow-me/utils';
// import logger from 'logger';

const Content = styled(ColumnWithMargins).attrs({
  margin: 24,
})`
  ${padding(30, 19)};
  height: 100%;
`;

const Header = styled(Centered)`
  left: 0;
  position: absolute;
  right: 0;
  top: -2;
  width: 100%;
`;

function useAndroidDisableGesturesOnFocus() {
  const route = useRoute();
  const isFocused = useIsFocused();
  useEffect(() => {
    android && route?.params?.toggleGestureEnabled?.(!isFocused);
  }, [isFocused, route]);
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

const SwapDetailsState = ({
  inputAmount,
  inputAmountDisplay,
  inputCurrency,
  inputExecutionRate,
  // inputNativePrice,
  longFormHeight,
  outputAmount,
  outputAmountDisplay,
  outputCurrency,
  outputExecutionRate,
  // outputNativePrice,
  restoreFocusOnSwapModal,
  slippage,
  // ...props
}) => {
  useEffect(() => () => restoreFocusOnSwapModal(), [restoreFocusOnSwapModal]);
  useAndroidDisableGesturesOnFocus();

  const {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  } = useSwapDetailsClipboardState();

  const contextValue = useMemo(
    () => ({
      inputAmount,
      inputAmountDisplay,
      inputCurrency,
      inputExecutionRate,
      isHighSlippage: slippage > SlippageWarningThresholdInBips,
      onCopySwapDetailsText,
      outputAmount,
      outputAmountDisplay,
      outputCurrency,
      outputExecutionRate,
    }),
    [
      inputAmount,
      inputAmountDisplay,
      inputCurrency,
      inputExecutionRate,
      onCopySwapDetailsText,
      outputAmount,
      outputAmountDisplay,
      outputCurrency,
      outputExecutionRate,
      slippage,
    ]
  );

  return (
    <SwapDetailsContext.Provider value={contextValue}>
      <Fragment>
        <SlackSheet
          additionalTopPadding={android}
          contentHeight={longFormHeight}
        >
          <Header>
            <SheetTitle weight="heavy">Review</SheetTitle>
          </Header>
          <SwapDetailsMasthead />
          <Content testID="swap-details-state">
            <SwapDetailsRow label="Price impact">
              <SwapDetailsValue
                color={colors.green}
                letterSpacing="roundedTight"
              >
                0.25%
              </SwapDetailsValue>
            </SwapDetailsRow>
            <SwapDetailsPriceRow />
            {!isETH(inputCurrency?.address) && (
              <SwapDetailsContractRow asset={inputCurrency} />
            )}
            {!isETH(outputCurrency?.address) && (
              <SwapDetailsContractRow asset={outputCurrency} />
            )}
            <SwapDetailsUniswapRow />
          </Content>
          {/*<ConfirmExchangeButton
            asset={outputCurrency}
            disabled={!Number(inputAmountDisplay)}
            isAuthorizing={false}
            isDeposit={false}
            isSufficientBalance
            isSufficientGas
            isSufficientLiquidity
            onSubmit={() => logger.log('submitting from SwapDetails!')}
            slippage={slippage}
            testID="swap-details-confirm"
            type={ExchangeModalTypes.swap}
          />
          <GasSpeedButton
            testID="swap-details-gas"
            type={ExchangeModalTypes.swap}
          />*/}
        </SlackSheet>
        <ToastPositionContainer>
          <CopyToast copiedText={copiedText} copyCount={copyCount} />
        </ToastPositionContainer>
      </Fragment>
    </SwapDetailsContext.Provider>
  );
};

export default React.memo(SwapDetailsState);
