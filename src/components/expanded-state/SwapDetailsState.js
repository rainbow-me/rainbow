import { useIsFocused, useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';
import { ConfirmExchangeButton } from '../exchange';
import { GasSpeedButton } from '../gas';
import { Column } from '../layout';
import { SheetTitle } from '../sheet';
import { CopyToast, ToastPositionContainer } from '../toasts';
import {
  SwapDetailsContent,
  SwapDetailsMasthead,
  SwapDetailsSlippageMessage,
} from './swap-details';
import { usePrevious, usePriceImpactDetails, useSwapCurrencies } from '@/hooks';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { abbreviations } from '@/utils';
import { getCrosschainSwapServiceTime } from '@/handlers/swap';
import { AdaptiveBottomSheet } from '@/navigation/bottom-sheet-navigator/components/AdaptiveBottomSheet';

const Footer = styled(Column).attrs({
  grow: 1,
  shrink: 0,
})({
  ...padding.object(6, 0, 0),
});

const Header = styled(Column).attrs({
  justify: 'start',
})();

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
  const isFocused = useIsFocused();
  const prevIsFocused = usePrevious(isFocused);
  const {
    params: {
      longFormHeight,
      currentNetwork,
      flashbotTransaction,
      isRefuelTx,
      onClose,
    } = {},
  } = useRoute();
  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const {
    derivedValues: { inputAmount, outputAmount },
    displayValues: { inputAmountDisplay, outputAmountDisplay },
    tradeDetails,
  } = useSelector(state => state.swap);

  const {
    inputPriceValue,
    isHighPriceImpact,
    outputPriceValue,
    priceImpactColor,
    priceImpactNativeAmount,
    priceImpactPercentDisplay,
  } = usePriceImpactDetails(
    inputAmount,
    outputAmount,
    inputCurrency,
    outputCurrency,
    currentNetwork
  );

  const {
    copiedText,
    copyCount,
    onCopySwapDetailsText,
  } = useSwapDetailsClipboardState();

  useEffect(() => {
    if (!isFocused && prevIsFocused) {
      return restoreFocusOnSwapModal();
    }
  }, [isFocused, prevIsFocused, restoreFocusOnSwapModal]);
  useAndroidDisableGesturesOnFocus();

  useEffect(() => {
    return () => {
      onClose?.();
    };
  }, [onClose]);

  return (
    <AdaptiveBottomSheet style={{ paddingBottom: 16 }}>
      <Header testID="swap-details-header">
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
        priceImpactColor={priceImpactColor}
        priceImpactNativeAmount={priceImpactNativeAmount}
        priceImpactPercentDisplay={priceImpactPercentDisplay}
      />
      <SwapDetailsContent
        isRefuelTx={isRefuelTx}
        isHighPriceImpact={isHighPriceImpact}
        onCopySwapDetailsText={onCopySwapDetailsText}
        tradeDetails={tradeDetails}
      />
      <Footer>
        <ConfirmExchangeButton
          {...confirmButtonProps}
          testID="swap-details-confirm-button"
        />
        <GasSpeedButton
          asset={outputCurrency}
          currentNetwork={currentNetwork}
          flashbotTransaction={flashbotTransaction}
          testID="swap-details-gas"
          theme="light"
          crossChainServiceTime={getCrosschainSwapServiceTime(tradeDetails)}
        />
      </Footer>
      <ToastPositionContainer>
        <CopyToast copiedText={copiedText} copyCount={copyCount} />
      </ToastPositionContainer>
    </AdaptiveBottomSheet>
  );
}
