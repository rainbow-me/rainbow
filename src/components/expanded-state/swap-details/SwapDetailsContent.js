import lang from 'i18n-js';
import React from 'react';
import { useSelector } from 'react-redux';
import { ButtonPressAnimation } from '../../animations';
import SwapDetailsContractRow from './SwapDetailsContractRow';
import SwapDetailsExchangeRow from './SwapDetailsExchangeRow';
import SwapDetailsFeeRow from './SwapDetailsFeeRow';
import SwapDetailsPriceRow from './SwapDetailsPriceRow';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { AccentColorProvider, Box, Rows, Separator } from '@/design-system';
import { isNativeAsset } from '@/handlers/assets';
import Routes from '@/navigation/routesNames';
import {
  useColorForAsset,
  useSwapAdjustedAmounts,
  useSwapCurrencies,
} from '@/hooks';
import { SwapModalField } from '@/redux/swap';
import styled from '@/styled-thing';
import { colors, padding } from '@/styles';
import { ethereumUtils } from '@/utils';
import { useNavigation } from '@/navigation';

const Container = styled(Box).attrs({
  flex: 1,
})(({ hasWarning }) => padding.object(hasWarning ? 24 : 30, 19, 30));

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
  const { navigate } = useNavigation();
  const inputAsExact = useSelector(
    state => state.swap.independentField !== SwapModalField.output
  );

  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const colorForAsset = useColorForAsset(outputCurrency, undefined, true, true);
  const inputCurrencyNetwork = ethereumUtils.getNetworkFromType(
    inputCurrency?.type
  );

  const [isLongWait, setIsLongWait] = useState(false);

  const estimatedWaitTime = useMemo(() => {
    const minutes = Math.floor(tradeDetails?.routes[0]?.maxServiceTime / 60);

    // if estimate is over an hour, lets round and show hours
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      setIsLongWait(true);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    setIsLongWait(false);
    return `${minutes} minutes`;
  }, [tradeDetails?.routes]);

  return (
    <AccentColorProvider color={colorForAsset}>
      <Container
        hasWarning={isHighPriceImpact}
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
          <SwapDetailsRow
            labelPress={() =>
              navigate(Routes.EXPLAIN_SHEET, {
                outputCurrency,
                outputToken: outputCurrency?.symbol,
                type: 'longWaitSwap',
              })
            }
            label={`${lang.t('expanded_state.swap.settling_time')} 􀅵`}
            testID="swaps-details-settling-time"
          >
            <SwapDetailsValue
              letterSpacing="roundedTight"
              color={{ custom: isLongWait && colors.lightOrange }}
            >
              {`${isLongWait ? '􀇿 ' : ''}${estimatedWaitTime}`}
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
              <Separator color="divider80 (Deprecated)" />
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
