import lang from 'i18n-js';
import React from 'react';
import { useSelector } from 'react-redux';
import { ButtonPressAnimation } from '../../animations';
import SwapDetailsContractRow from './SwapDetailsContractRow';
import SwapDetailsExchangeRow from './SwapDetailsExchangeRow';
import SwapDetailsFeeRow from './SwapDetailsFeeRow';
import SwapDetailsPriceRow from './SwapDetailsPriceRow';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { AccentColorProvider, Box, Divider, Rows } from '@/design-system';
import { isNativeAsset } from '@/handlers/assets';
import {
  useColorForAsset,
  useSwapAdjustedAmounts,
  useSwapCurrencies,
} from '@/hooks';
import { SwapModalField } from '@/redux/swap';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { ethereumUtils } from '@/utils';

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
          <SwapDetailsRow
            label={receivedSoldLabel}
            testID="swaps-details-value-row"
          >
            <SwapDetailsValue letterSpacing="roundedTight">
              {amountReceivedSold}{' '}
              {inputAsExact ? outputCurrency.symbol : inputCurrency.symbol}
            </SwapDetailsValue>
          </SwapDetailsRow>
          {tradeDetails?.protocols && (
            <SwapDetailsExchangeRow
              protocols={tradeDetails?.protocols}
              testID="swaps-details-protocols-row"
            />
          )}
          {tradeDetails.feePercentageBasisPoints !== 0 && (
            <SwapDetailsFeeRow
              network={inputCurrencyNetwork}
              testID="swaps-details-fee-row"
              tradeDetails={tradeDetails}
            />
          )}
          {!detailsExpanded && (
            <Box
              style={{
                // cancel out the extra padding below
                marginVertical: -18,
              }}
            >
              <ButtonPressAnimation
                onPress={() => setDetailsExpanded(!detailsExpanded)}
                scaleTo={1.06}
                style={{
                  // enlarge tap target for details button
                  paddingVertical: 18,
                }}
                testID="swaps-details-show-details-button"
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
            </Box>
          )}
          {detailsExpanded && (
            <Rows space="24px">
              <Divider />
              <SwapDetailsPriceRow
                testID="swaps-details-price-row"
                tradeDetails={tradeDetails}
              />
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
