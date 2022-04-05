import lang from 'i18n-js';
import React, { useCallback } from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import Skeleton, { FakeText } from '../../skeleton/Skeleton';
import {
  Box,
  Column,
  Columns,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { REGISTRATION_MODES } from '@rainbow-me/helpers/ens';

function StepButton({
  onPress,
  type,
}: {
  onPress: () => void;
  type: 'increment' | 'decrement';
}) {
  return (
    // @ts-ignore
    <Box as={ButtonPressAnimation} onPress={onPress} scaleTo={0.75}>
      <Text color="accent" weight="heavy">
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
  onChangeDuration: (duration: number) => void;
  networkFee: string;
  totalCost: string;
  estimatedCostETH: string;
  registrationFee: string;
  newExpiryDate?: string;
  mode: REGISTRATION_MODES.CREATE | REGISTRATION_MODES.RENEW;
}) {
  return (
    <Box>
      <Stack space="34px">
        <Columns>
          <Column width="3/5">
            <Text size="16px" weight="heavy">
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
                    onPress={useCallback(
                      () =>
                        duration > 1
                          ? onChangeDuration(duration - 1)
                          : undefined,
                      [duration, onChangeDuration]
                    )}
                    type="decrement"
                  />
                </Column>
                <Box>
                  <Text align="center" size="16px" weight="heavy">
                    {duration > 1
                      ? lang.t('profiles.confirm.duration_plural', {
                          content: duration,
                        })
                      : lang.t('profiles.confirm.duration_singular')}
                  </Text>
                </Box>
                <Column width="content">
                  <StepButton
                    onPress={useCallback(
                      () =>
                        duration < maxDuration
                          ? onChangeDuration(duration + 1)
                          : undefined,
                      [duration, maxDuration, onChangeDuration]
                    )}
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
              <Text color="secondary80" size="16px" weight="bold">
                {lang.t('profiles.confirm.new_expiration_date')}
              </Text>
            </Column>
            <Column width="1/3">
              <Text align="right" color="secondary80" size="16px" weight="bold">
                {newExpiryDate}
              </Text>
            </Column>
          </Columns>
        )}

        <Columns>
          <Column width="2/3">
            <Text color="secondary80" size="16px" weight="bold">
              {lang.t('profiles.confirm.registration_cost')}
            </Text>
          </Column>
          <Column width="1/3">
            {registrationFee ? (
              <Text align="right" color="secondary80" size="16px" weight="bold">
                {registrationFee}
              </Text>
            ) : (
              <LoadingPlaceholder />
            )}
          </Column>
        </Columns>

        <Columns>
          <Column width="2/3">
            <Text color="secondary80" size="16px" weight="bold">
              {lang.t('profiles.confirm.current_fees')}
            </Text>
          </Column>
          <Column width="1/3">
            {networkFee ? (
              <Text align="right" color="secondary80" size="16px" weight="bold">
                {networkFee}
              </Text>
            ) : (
              <LoadingPlaceholder />
            )}
          </Column>
        </Columns>

        {mode === REGISTRATION_MODES.CREATE && (
          <Columns>
            <Column width="2/3">
              <Text color="secondary80" size="16px" weight="bold">
                {lang.t('profiles.confirm.estimated_total_eth')}
              </Text>
            </Column>
            <Column width="1/3">
              {networkFee ? (
                <Text
                  align="right"
                  color="secondary80"
                  size="16px"
                  weight="bold"
                >
                  {estimatedCostETH} ETH
                </Text>
              ) : (
                <LoadingPlaceholder />
              )}
            </Column>
          </Columns>
        )}

        <Columns>
          <Column width="2/3">
            <Text size="16px" weight="heavy">
              {lang.t('profiles.confirm.estimated_total')}
            </Text>
          </Column>
          <Column width="1/3">
            {totalCost ? (
              <Text align="right" size="16px" weight="heavy">
                {totalCost}
              </Text>
            ) : (
              <LoadingPlaceholder />
            )}
          </Column>
        </Columns>
      </Stack>
    </Box>
  );
}
