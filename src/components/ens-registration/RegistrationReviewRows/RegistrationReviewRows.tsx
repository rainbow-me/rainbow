import lang from 'i18n-js';
import React, { useCallback } from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import Skeleton, { FakeText } from '../../skeleton/Skeleton';
import { Box, Column, Columns, Inset, Stack, Text } from '@/design-system';
import { REGISTRATION_MODES } from '@/helpers/ens';
import { useInterval } from '@/hooks';

const MIN_LONG_PRESS_DURATION = 200;
const LONG_PRESS_INTERVAL = 69;

function StepButton({
  onLongPress,
  onLongPressEnded,
  onPress,
  type,
  disabled,
}: {
  onPress: () => void;
  onLongPress: () => void;
  onLongPressEnded: () => void;
  type: 'increment' | 'decrement';
  disabled: boolean;
}) {
  return (
    <Box
      as={ButtonPressAnimation}
      // @ts-ignore overloaded props
      minLongPressDuration={MIN_LONG_PRESS_DURATION}
      onLongPress={onLongPress}
      onLongPressEnded={onLongPressEnded}
      onPress={onPress}
      scaleTo={disabled ? 1 : 0.75}
      shouldLongPressHoldPress
    >
      <Text
        color={disabled ? 'secondary20 (Deprecated)' : 'accent'}
        size="16px / 22px (Deprecated)"
        weight="heavy"
      >
        {type === 'increment' ? '􀁍' : '􀁏'}
      </Text>
    </Box>
  );
}

function LoadingPlaceholder() {
  return (
    <Skeleton animated>
      <Box alignItems="flex-end">
        <FakeText height={16} width={80} />
      </Box>
    </Skeleton>
  );
}

export default function RegistrationReviewRows({
  duration,
  onChangeDuration,
  maxDuration,
  networkFee,
  totalCost,
  registrationFee,
  estimatedCostETH,
  mode,
  newExpiryDate,
}: {
  maxDuration: number;
  duration: number;
  onChangeDuration: React.Dispatch<React.SetStateAction<number>>;
  networkFee: string;
  totalCost: string;
  estimatedCostETH: string;
  registrationFee: string;
  newExpiryDate?: string;
  mode: REGISTRATION_MODES.CREATE | REGISTRATION_MODES.RENEW;
}) {
  const [startLongPress, endLongPress] = useInterval();

  const handlePressDecrement = useCallback(
    () =>
      onChangeDuration(duration => (duration > 1 ? duration - 1 : duration)),
    [onChangeDuration]
  );

  const handleLongPressDecrement = useCallback(() => {
    startLongPress(handlePressDecrement, LONG_PRESS_INTERVAL);
  }, [handlePressDecrement, startLongPress]);

  const handlePressIncrement = useCallback(
    () =>
      onChangeDuration(duration =>
        duration < maxDuration ? duration + 1 : duration
      ),
    [maxDuration, onChangeDuration]
  );

  const handleLongPressIncrement = useCallback(() => {
    startLongPress(() => handlePressIncrement(), LONG_PRESS_INTERVAL);
  }, [handlePressIncrement, startLongPress]);

  return (
    <Box>
      <Stack space="30px (Deprecated)">
        <Columns>
          <Column width="3/5">
            <Text
              color="primary (Deprecated)"
              size="16px / 22px (Deprecated)"
              weight="heavy"
            >
              {lang.t(
                `profiles.confirm.${
                  mode === REGISTRATION_MODES.CREATE
                    ? 'registration_duration'
                    : 'extend_by'
                }`
              )}
            </Text>
          </Column>
          <Column width="2/5">
            <Inset left="4px">
              <Columns>
                <Column width="content">
                  <StepButton
                    disabled={duration === 1}
                    onLongPress={handleLongPressDecrement}
                    onLongPressEnded={endLongPress}
                    onPress={handlePressDecrement}
                    type="decrement"
                  />
                </Column>
                <Box height={{ custom: 16 }}>
                  <Text
                    align="center"
                    color="primary (Deprecated)"
                    size="16px / 22px (Deprecated)"
                    weight="heavy"
                  >
                    {duration > 1
                      ? lang.t('profiles.confirm.duration_plural', {
                          content: duration,
                        })
                      : lang.t('profiles.confirm.duration_singular')}
                  </Text>
                </Box>
                <Column width="content">
                  <StepButton
                    disabled={false}
                    onLongPress={handleLongPressIncrement}
                    onLongPressEnded={endLongPress}
                    onPress={handlePressIncrement}
                    type="increment"
                  />
                </Column>
              </Columns>
            </Inset>
          </Column>
        </Columns>

        {mode === REGISTRATION_MODES.RENEW && (
          <Columns>
            <Column width="2/3">
              <Text
                color="secondary80 (Deprecated)"
                size="16px / 22px (Deprecated)"
                weight="bold"
              >
                {lang.t('profiles.confirm.new_expiration_date')}
              </Text>
            </Column>
            <Column width="1/3">
              <Text
                align="right"
                color="secondary80 (Deprecated)"
                size="16px / 22px (Deprecated)"
                weight="bold"
              >
                {newExpiryDate}
              </Text>
            </Column>
          </Columns>
        )}

        <Columns>
          <Column width="2/3">
            <Text
              color="secondary80 (Deprecated)"
              size="16px / 22px (Deprecated)"
              weight="bold"
            >
              {lang.t('profiles.confirm.registration_cost')}
            </Text>
          </Column>
          <Column width="1/3">
            <Box height={{ custom: 16 }}>
              {registrationFee ? (
                <Text
                  align="right"
                  color="secondary80 (Deprecated)"
                  size="16px / 22px (Deprecated)"
                  weight="bold"
                >
                  {registrationFee}
                </Text>
              ) : (
                <LoadingPlaceholder />
              )}
            </Box>
          </Column>
        </Columns>

        <Columns>
          <Column width="2/3">
            <Text
              color="secondary80 (Deprecated)"
              size="16px / 22px (Deprecated)"
              weight="bold"
            >
              {lang.t('profiles.confirm.estimated_fees')}
            </Text>
          </Column>
          <Column width="1/3">
            <Box height={{ custom: 16 }}>
              {networkFee ? (
                <Text
                  align="right"
                  color="secondary80 (Deprecated)"
                  size="16px / 22px (Deprecated)"
                  weight="bold"
                >
                  {networkFee}
                </Text>
              ) : (
                <LoadingPlaceholder />
              )}
            </Box>
          </Column>
        </Columns>

        {mode === REGISTRATION_MODES.CREATE && (
          <Columns>
            <Column width="2/3">
              <Text
                color="secondary80 (Deprecated)"
                size="16px / 22px (Deprecated)"
                weight="bold"
              >
                {lang.t('profiles.confirm.estimated_total_eth')}
              </Text>
            </Column>
            <Column width="1/3">
              <Box height={{ custom: 16 }}>
                {networkFee ? (
                  <Text
                    align="right"
                    color="secondary80 (Deprecated)"
                    size="16px / 22px (Deprecated)"
                    weight="bold"
                  >
                    {estimatedCostETH} ETH
                  </Text>
                ) : (
                  <LoadingPlaceholder />
                )}
              </Box>
            </Column>
          </Columns>
        )}

        <Columns>
          <Column width="2/3">
            <Text
              color="primary (Deprecated)"
              size="16px / 22px (Deprecated)"
              weight="heavy"
            >
              {lang.t('profiles.confirm.estimated_total')}
            </Text>
          </Column>
          <Column width="1/3">
            <Box height={{ custom: 16 }}>
              {totalCost ? (
                <Text
                  align="right"
                  color="primary (Deprecated)"
                  size="16px / 22px (Deprecated)"
                  weight="heavy"
                >
                  {totalCost}
                </Text>
              ) : (
                <LoadingPlaceholder />
              )}
            </Box>
          </Column>
        </Columns>
      </Stack>
    </Box>
  );
}
