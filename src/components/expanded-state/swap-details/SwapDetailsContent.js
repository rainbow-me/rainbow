import React from 'react';
import { useSelector } from 'react-redux';
import { ButtonPressAnimation } from '../../animations';
import SwapDetailsContractRow from './SwapDetailsContractRow';
import SwapDetailsFeeRow from './SwapDetailsFeeRow';
import SwapDetailsPriceRow from './SwapDetailsPriceRow';

import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import SwapDetailsUniswapRow from './SwapDetailsUniswapRow';
import { AccentColorProvider, Box, Rows } from '@rainbow-me/design-system';
import {
  useColorForAsset,
  useSwapAdjustedAmounts,
  useSwapCurrencies,
} from '@rainbow-me/hooks';
import { SwapModalField } from '@rainbow-me/redux/swap';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';
import { isETH } from '@rainbow-me/utils';

const Container = styled(Box).attrs({
  flex: 1,
})(({ isHighPriceImpact }) =>
  padding.object(isHighPriceImpact ? 24 : 30, 19, 0)
);

export default function SwapDetailsContent({
  isHighPriceImpact,
  onCopySwapDetailsText,
  priceImpactColor,
  priceImpactNativeAmount,
  priceImpactPercentDisplay,
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

  const showPriceImpact =
    (!isHighPriceImpact || priceImpactNativeAmount) &&
    priceImpactPercentDisplay;

  const rainbowFee = '0.85%';

  const [areDetailsExpanded, setAreDetailsExpanded] = useState(false);

  const colorForAsset = useColorForAsset(outputCurrency, undefined, true, true);

  return (
    <AccentColorProvider color={colorForAsset}>
      <Container
        isHighPriceImpact={isHighPriceImpact}
        testID="swap-details-state"
        {...props}
      >
        <Rows space="24px">
          <SwapDetailsFeeRow fee={rainbowFee} />
          <SwapDetailsPriceRow tradeDetails={tradeDetails} />
          <ButtonPressAnimation
            onPress={() => setAreDetailsExpanded(!areDetailsExpanded)}
            scaleTo={1.05}
          >
            <SwapDetailsRow
              label={areDetailsExpanded ? 'Hide Details' : 'Show Details'}
              labelColor="accent"
            >
              <SwapDetailsValue color="accent">
                {areDetailsExpanded ? '􀁰' : '􀯼'}
              </SwapDetailsValue>
            </SwapDetailsRow>
          </ButtonPressAnimation>
          <Box>
            {areDetailsExpanded && (
              <Rows space="24px">
                <SwapDetailsUniswapRow protocols={tradeDetails?.protocols} />
                {showPriceImpact && (
                  <AccentColorProvider color={priceImpactColor}>
                    <SwapDetailsRow label="Price impact">
                      <SwapDetailsValue
                        color="accent"
                        letterSpacing="roundedTight"
                      >
                        {priceImpactPercentDisplay}
                      </SwapDetailsValue>
                    </SwapDetailsRow>
                  </AccentColorProvider>
                )}
                <SwapDetailsRow label={receivedSoldLabel}>
                  <SwapDetailsValue letterSpacing="roundedTight">
                    {amountReceivedSold}{' '}
                    {inputAsExact
                      ? outputCurrency.symbol
                      : inputCurrency.symbol}
                  </SwapDetailsValue>
                </SwapDetailsRow>

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
              </Rows>
            )}
          </Box>
        </Rows>
      </Container>
    </AccentColorProvider>
  );
}
