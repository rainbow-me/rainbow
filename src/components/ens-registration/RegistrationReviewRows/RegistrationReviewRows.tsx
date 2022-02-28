import React, { useCallback } from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import Skeleton, { FakeText } from '../../skeleton/Skeleton';
import lang from 'i18n-js';
import {
  Box,
  Column,
  Columns,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';

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
}: {
  maxDuration: number;
  duration: number;
  onChangeDuration: (duration: number) => void;
  networkFee: string;
  totalCost: string;
  registrationFee: string;
}) {
  return (
    <Box>
      <Stack space="34px">
        <Columns>
          <Column width="3/5">
            <Text size="16px" weight="heavy">
              {lang.t('profiles.confirm.registration_duration')}
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
              {lang.t('profiles.confirm.estimated_fees')}
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
        <Columns>
          <Column width="2/3">
            <Text size="16px" weight="heavy">
              {lang.t('profiles.confirm.total_cost')}
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
