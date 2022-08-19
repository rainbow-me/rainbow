import lang from 'i18n-js';
import React from 'react';
import { useSelector } from 'react-redux';
import { ButtonPressAnimation } from '../../animations';
import SwapDetailsContractRow from './SwapDetailsContractRow';
import SwapDetailsExchangeRow from './SwapDetailsExchangeRow';
import SwapDetailsFeeRow from './SwapDetailsFeeRow';
import SwapDetailsPriceRow from './SwapDetailsPriceRow';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import {
  AccentColorProvider,
  Box,
  Divider,
  Rows,
} from '@/design-system';
import { isNativeAsset } from '@rainbow-me/handlers/assets';
import {
  useColorForAsset,
  useSwapAdjustedAmounts,
  useSwapCurrencies,
} from '@rainbow-me/hooks';
import { SwapModalField } from '@rainbow-me/redux/swap';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';
import { ethereumUtils } from '@rainbow-me/utils';

const Container = styled(Box).attrs({
  flex: 1,
})(({ isHighPriceImpact }) =>
  padding.object(isHighPriceImpact ? 24 : 30, 19, 30)
);

export default function SwapDetailsContent({
  isHighPriceImpact,
  onCopySwapDetailsText,
  tradeDetails,
  ...props
}) {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();
  const { amountReceivedSold, receivedSoldLabel } = useSwapAdjustedAmounts(
    tradeDetails
  );
  const inputAsExact = useSelector(
    state => state.swap.independentField !== SwapModalField.output
  );

  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const colorForAsset = useColorForAsset(outputCurrency, undefined, true, true);
  const inputCurrencyNetwork = ethereumUtils.getNetworkFromType(
    inputCurrency?.type
  );
  return (
    <AccentColorProvider color={colorForAsset}>
      <Container
        isHighPriceImpact={isHighPriceImpact}
        testID="swap-details-state"
        {...props}
      >
        <Rows space="24px">
          <SwapDetailsRow label={receivedSoldLabel}>
            <SwapDetailsValue letterSpacing="roundedTight">
              {amountReceivedSold}{' '}
              {inputAsExact ? outputCurrency.symbol : inputCurrency.symbol}
            </SwapDetailsValue>
          </SwapDetailsRow>
          {tradeDetails?.protocols && (
            <SwapDetailsExchangeRow protocols={tradeDetails?.protocols} />
          )}
          {tradeDetails.feePercentageBasisPoints !== 0 && (
            <SwapDetailsFeeRow
              network={inputCurrencyNetwork}
              tradeDetails={tradeDetails}
            />
          )}
          {!detailsExpanded && (
            <ButtonPressAnimation
              onPress={() => setDetailsExpanded(!detailsExpanded)}
              scaleTo={1.06}
            >
              <SwapDetailsRow
                label={
                  detailsExpanded
                    ? lang.t('expanded_state.swap_details.hide_details')
                    : lang.t('expanded_state.swap_details.show_details')
                }
              >
                <SwapDetailsValue>
                  {detailsExpanded ? '􀁮' : '􀁰'}
                </SwapDetailsValue>
              </SwapDetailsRow>
            </ButtonPressAnimation>
          )}
          {detailsExpanded && (
            <Rows space="24px">
              <Divider />
              <SwapDetailsPriceRow tradeDetails={tradeDetails} />
              {!isNativeAsset(inputCurrency?.address, inputCurrencyNetwork) && (
                <SwapDetailsContractRow
                  asset={inputCurrency}
                  onCopySwapDetailsText={onCopySwapDetailsText}
                />
              )}
              {!isNativeAsset(
                outputCurrency?.address,
                inputCurrencyNetwork
              ) && (
                <SwapDetailsContractRow
                  asset={outputCurrency}
                  onCopySwapDetailsText={onCopySwapDetailsText}
                />
              )}
            </Rows>
          )}
        </Rows>
      </Container>
    </AccentColorProvider>
  );
}
