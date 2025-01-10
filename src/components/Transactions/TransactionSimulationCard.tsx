import React, { useMemo } from 'react';
import * as i18n from '@/languages';
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Box, Inline, Stack, Text } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';

import { TransactionErrorType, TransactionSimulationResult, TransactionScanResultType } from '@/graphql/__generated__/metadataPOST';

import { isEmpty } from 'lodash';
import { TransactionSimulatedEventRow } from '@/components/Transactions/TransactionSimulatedEventRow';
import { FadedScrollCard } from '@/components/FadedScrollCard';
import { EventIcon, IconContainer } from '@/components/Transactions/TransactionIcons';
import {
  COLLAPSED_CARD_HEIGHT,
  MAX_CARD_HEIGHT,
  CARD_ROW_HEIGHT,
  CARD_BORDER_WIDTH,
  EXPANDED_CARD_TOP_INSET,
  rotationConfig,
  timingConfig,
} from '@/components/Transactions/constants';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ParsedAddressAsset } from '@/entities/tokens';

interface TransactionSimulationCardProps {
  chainId: ChainId;
  expandedCardBottomInset: number;
  isBalanceEnough: boolean | undefined;
  isLoading: boolean;
  txSimulationApiError: unknown;
  isPersonalSignRequest: boolean;
  noChanges: boolean;
  simulation: TransactionSimulationResult | undefined;
  simulationError: TransactionErrorType | undefined;
  simulationScanResult: TransactionScanResultType | undefined;
  nativeAsset: ParsedAddressAsset | ReturnType<ReturnType<typeof useBackendNetworksStore.getState>['getChainsNativeAsset']>[ChainId];
}

export const TransactionSimulationCard = ({
  chainId,
  expandedCardBottomInset,
  isBalanceEnough,
  isLoading,
  txSimulationApiError,
  isPersonalSignRequest,
  noChanges,
  simulation,
  simulationError,
  simulationScanResult,
  nativeAsset,
}: TransactionSimulationCardProps) => {
  const cardHeight = useSharedValue(COLLAPSED_CARD_HEIGHT);
  const contentHeight = useSharedValue(COLLAPSED_CARD_HEIGHT - CARD_BORDER_WIDTH * 2);
  const spinnerRotation = useSharedValue(0);

  const listStyle = useAnimatedStyle(() => ({
    opacity: noChanges
      ? withTiming(1, timingConfig)
      : interpolate(
          cardHeight.value,
          [
            COLLAPSED_CARD_HEIGHT,
            contentHeight.value + CARD_BORDER_WIDTH * 2 > MAX_CARD_HEIGHT ? MAX_CARD_HEIGHT : contentHeight.value + CARD_BORDER_WIDTH * 2,
          ],
          [0, 1]
        ),
  }));

  const spinnerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spinnerRotation.value}deg` }],
    };
  });

  useAnimatedReaction(
    () => ({ isLoading, isPersonalSignRequest }),
    ({ isLoading, isPersonalSignRequest }, previous = { isLoading: false, isPersonalSignRequest: false }) => {
      if (isLoading && !previous?.isLoading) {
        spinnerRotation.value = withRepeat(withTiming(360, rotationConfig), -1, false);
      } else if (
        (!isLoading && previous?.isLoading) ||
        (isPersonalSignRequest && !previous?.isPersonalSignRequest && previous?.isLoading)
      ) {
        spinnerRotation.value = withTiming(360, timingConfig);
      }
    },
    [isLoading, isPersonalSignRequest]
  );
  const renderSimulationEventRows = useMemo(() => {
    if (isBalanceEnough === false) return null;

    return (
      <>
        {simulation?.approvals?.map(change => {
          return (
            <TransactionSimulatedEventRow
              key={`${change?.asset?.assetCode}-${change?.quantityAllowed}`}
              amount={change?.quantityAllowed || '10'}
              asset={change?.asset}
              eventType="approve"
            />
          );
        })}
        {simulation?.out?.map(change => {
          return (
            <TransactionSimulatedEventRow
              key={`${change?.asset?.assetCode}-${change?.quantity}`}
              amount={change?.quantity || '10'}
              asset={change?.asset}
              price={change?.price}
              eventType="send"
            />
          );
        })}
        {simulation?.in?.map(change => {
          return (
            <TransactionSimulatedEventRow
              key={`${change?.asset?.assetCode}-${change?.quantity}`}
              amount={change?.quantity || '10'}
              asset={change?.asset}
              price={change?.price}
              eventType="receive"
            />
          );
        })}
      </>
    );
  }, [isBalanceEnough, simulation]);

  const titleColor: TextColor = useMemo(() => {
    if (isLoading) {
      return 'label';
    }
    if (isBalanceEnough === false) {
      return 'blue';
    }
    if (noChanges || isPersonalSignRequest || txSimulationApiError) {
      return 'labelQuaternary';
    }
    if (simulationScanResult === TransactionScanResultType.Warning) {
      return 'orange';
    }
    if (simulationError || simulationScanResult === TransactionScanResultType.Malicious) {
      return 'red';
    }
    return 'label';
  }, [isBalanceEnough, isLoading, noChanges, simulationError, simulationScanResult, isPersonalSignRequest, txSimulationApiError]);

  const titleText = useMemo(() => {
    if (isLoading) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.simulating);
    }
    if (isBalanceEnough === false) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.not_enough_native_balance, { symbol: nativeAsset.symbol });
    }
    if (txSimulationApiError || isPersonalSignRequest) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.simulation_unavailable);
    }
    if (simulationScanResult === TransactionScanResultType.Warning) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.proceed_carefully);
    }
    if (simulationScanResult === TransactionScanResultType.Malicious) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.suspicious_transaction);
    }
    if (noChanges) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.no_changes);
    }
    if (simulationError) {
      return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.likely_to_fail);
    }
    return i18n.t(i18n.l.walletconnect.simulation.simulation_card.titles.simulation_result);
  }, [
    isLoading,
    isBalanceEnough,
    txSimulationApiError,
    isPersonalSignRequest,
    simulationScanResult,
    noChanges,
    simulationError,
    nativeAsset.symbol,
  ]);

  const isExpanded = useMemo(() => {
    if (isLoading || isPersonalSignRequest) {
      return false;
    }
    const shouldExpandOnLoad = isBalanceEnough === false || (!isEmpty(simulation) && !noChanges) || !!simulationError;
    return shouldExpandOnLoad;
  }, [isBalanceEnough, isLoading, isPersonalSignRequest, noChanges, simulation, simulationError]);

  return (
    <FadedScrollCard
      cardHeight={cardHeight}
      contentHeight={contentHeight}
      expandedCardBottomInset={expandedCardBottomInset}
      expandedCardTopInset={EXPANDED_CARD_TOP_INSET}
      isExpanded={isExpanded}
    >
      <Stack space={simulationError || isBalanceEnough === false ? '16px' : '24px'}>
        <Box alignItems="center" flexDirection="row" justifyContent="space-between" height={{ custom: CARD_ROW_HEIGHT }}>
          <Inline alignVertical="center" space="12px">
            {!isLoading && (simulationError || isBalanceEnough === false || simulationScanResult !== TransactionScanResultType.Ok) ? (
              <EventIcon
                eventType={
                  simulationScanResult && simulationScanResult !== TransactionScanResultType.Ok
                    ? simulationScanResult
                    : simulationError
                      ? 'failed'
                      : 'insufficientBalance'
                }
              />
            ) : (
              <IconContainer>
                {!isLoading && noChanges && !isPersonalSignRequest ? (
                  <Text align="center" color="labelQuaternary" size="icon 17px" weight="bold">
                    {/* The extra space avoids icon clipping */}
                    {'􀻾 '}
                  </Text>
                ) : (
                  <Animated.View style={spinnerStyle}>
                    <Text
                      align="center"
                      color={isLoading ? 'label' : isPersonalSignRequest ? 'labelQuaternary' : 'label'}
                      size="icon 15px"
                      weight="bold"
                    >
                      􀬨
                    </Text>
                  </Animated.View>
                )}
              </IconContainer>
            )}
            <Text color={titleColor} size="17pt" weight="bold">
              {titleText}
            </Text>
          </Inline>
          {/* TODO: Unhide once we add explainer sheets */}
          {/* <Animated.View style={listStyle}>
            <TouchableWithoutFeedback>
              <ButtonPressAnimation disabled={!isExpanded && !noChanges}>
                <IconContainer hitSlop={14} size={16} opacity={0.6}>
                  <Text
                    align="center"
                    color="labelQuaternary"
                    size="icon 15px"
                    weight="semibold"
                  >
                    􀁜
                  </Text>
                </IconContainer>
              </ButtonPressAnimation>
            </TouchableWithoutFeedback>
          </Animated.View> */}
        </Box>
        <Animated.View style={listStyle}>
          <Stack space="20px">
            {isBalanceEnough === false ? (
              <Text color="labelQuaternary" size="13pt" weight="semibold">
                {i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.need_more_native, {
                  symbol: nativeAsset.symbol,
                  network: useBackendNetworksStore.getState().getChainsName()[chainId],
                })}
              </Text>
            ) : (
              <>
                {isPersonalSignRequest && (
                  <Box style={{ opacity: 0.6 }}>
                    <Text color="labelQuaternary" size="13pt" weight="semibold">
                      {i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.unavailable_personal_sign)}
                    </Text>
                  </Box>
                )}
                {txSimulationApiError && (
                  <Text color="labelQuaternary" size="13pt" weight="semibold">
                    {i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.tx_api_error)}
                  </Text>
                )}
                {simulationError && (
                  <Text color="labelQuaternary" size="13pt" weight="semibold">
                    {i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.failed_to_simulate)}
                  </Text>
                )}
                {simulationScanResult === TransactionScanResultType.Warning && (
                  <Text color="labelQuaternary" size="13pt" weight="semibold">
                    {i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.warning)}{' '}
                  </Text>
                )}
                {simulationScanResult === TransactionScanResultType.Malicious && (
                  <Text color="labelQuaternary" size="13pt" weight="semibold">
                    {i18n.t(i18n.l.walletconnect.simulation.simulation_card.messages.malicious)}
                  </Text>
                )}
              </>
            )}
            {renderSimulationEventRows}
          </Stack>
        </Animated.View>
      </Stack>
    </FadedScrollCard>
  );
};
