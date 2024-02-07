import lang from 'i18n-js';
import React from 'react';
import { useSelector, View } from 'react-redux';
import { ButtonPressAnimation } from '../../animations';
import SwapDetailsContractRow from './SwapDetailsContractRow';
import SwapDetailsExchangeRow from './SwapDetailsExchangeRow';
import SwapDetailsFeeRow from './SwapDetailsFeeRow';
import SwapDetailsPriceRow from './SwapDetailsPriceRow';
import SwapDetailsRefuelRow from './SwapDetailsRefuelRow';
import SwapDetailsRow, { SwapDetailsValue } from './SwapDetailsRow';
import { AccentColorProvider, Box, Rows, Separator } from '@/design-system';
import { isNativeAsset } from '@/handlers/assets';
import Routes from '@/navigation/routesNames';
import { useAccountSettings, useColorForAsset, useSwapAdjustedAmounts, useSwapCurrencies } from '@/hooks';
import { SwapModalField } from '@/redux/swap';
import styled from '@/styled-thing';
import { padding } from '@/styles';

import { useNavigation } from '@/navigation';
import { Network } from '@/helpers';
import { SwapDetailsRewardRow } from './SwapDetailsRewardRow';
import useExperimentalFlag, { OP_REWARDS } from '@rainbow-me/config/experimentalHooks';
import { useRemoteConfig } from '@/model/remoteConfig';

const Container = styled(Box).attrs({
  flex: 1,
})(({ hasWarning }) => padding.object(hasWarning ? 24 : 30, 19, 30));

export default function SwapDetailsContent({ isHighPriceImpact, isRefuelTx, onCopySwapDetailsText, tradeDetails, onPressMore, ...props }) {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();
  const { amountReceivedSold, receivedSoldLabel } = useSwapAdjustedAmounts(tradeDetails);
  const { navigate } = useNavigation();
  const { flashbotsEnabled } = useAccountSettings();
  const inputAsExact = useSelector(state => state.swap.independentField !== SwapModalField.output);

  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const colorForAsset = useColorForAsset(outputCurrency, undefined, true, true);
  const inputCurrencyNetwork = inputCurrency.network;
  const outputCurrencyNetwork = outputCurrency.network;
  const { op_rewards_enabled } = useRemoteConfig();
  const hasReward = (useExperimentalFlag(OP_REWARDS) || op_rewards_enabled) && !!tradeDetails.reward?.[0];

  return (
    <AccentColorProvider color={colorForAsset}>
      <Container hasWarning={isHighPriceImpact} testID="swap-details-state" {...props}>
        <Rows space="24px">
          <SwapDetailsRow label={receivedSoldLabel} testID="swaps-details-value-row">
            <SwapDetailsValue letterSpacing="roundedTight">
              {amountReceivedSold} {inputAsExact ? outputCurrency.symbol : inputCurrency.symbol}
            </SwapDetailsValue>
          </SwapDetailsRow>

          {(isRefuelTx || tradeDetails?.refuel) && <SwapDetailsRefuelRow testID="swaps-details-refuel-row" tradeDetails={tradeDetails} />}

          {tradeDetails?.protocols && (
            <SwapDetailsExchangeRow
              protocols={tradeDetails?.protocols}
              routes={tradeDetails?.routes}
              testID="swaps-details-protocols-row"
            />
          )}
          {tradeDetails.feePercentageBasisPoints !== 0 && (
            <SwapDetailsFeeRow network={outputCurrencyNetwork} testID="swaps-details-fee-row" tradeDetails={tradeDetails} />
          )}
          {hasReward && <SwapDetailsRewardRow reward={tradeDetails.reward?.[0]} />}
          {flashbotsEnabled && inputCurrencyNetwork === Network.mainnet && (
            <SwapDetailsRow
              labelPress={() =>
                navigate(Routes.EXPLAIN_SHEET, {
                  type: 'flashbots',
                })
              }
              label={`${lang.t('expanded_state.swap.flashbots_protect')} 􀅵`}
              testID="swaps-details-flashbots-row"
            >
              <SwapDetailsValue letterSpacing="roundedTight">{`${lang.t('expanded_state.swap.on')} 􀞜`}</SwapDetailsValue>
            </SwapDetailsRow>
          )}
          {!detailsExpanded && (
            <Box
              style={{
                // cancel out the extra padding below
                marginVertical: -18,
              }}
            >
              <ButtonPressAnimation
                onPress={() => {
                  setDetailsExpanded(!detailsExpanded);
                  onPressMore();
                }}
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
                  <SwapDetailsValue>{detailsExpanded ? '􀁮' : '􀁰'}</SwapDetailsValue>
                </SwapDetailsRow>
              </ButtonPressAnimation>
            </Box>
          )}
          {detailsExpanded && (
            <Rows space="24px">
              <Separator color="divider80 (Deprecated)" />
              <SwapDetailsPriceRow testID="swaps-details-price-row" tradeDetails={tradeDetails} />
              {!isNativeAsset(inputCurrency?.address, inputCurrencyNetwork) && (
                <SwapDetailsContractRow asset={inputCurrency} onCopySwapDetailsText={onCopySwapDetailsText} />
              )}
              {!isNativeAsset(outputCurrency?.address, inputCurrencyNetwork) && (
                <SwapDetailsContractRow asset={outputCurrency} onCopySwapDetailsText={onCopySwapDetailsText} />
              )}
            </Rows>
          )}
        </Rows>
      </Container>
    </AccentColorProvider>
  );
}
