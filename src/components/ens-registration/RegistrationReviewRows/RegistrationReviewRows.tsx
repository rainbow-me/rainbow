import React from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
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
              Register name for
            </Text>
          </Column>
          <Column width="2/5">
            <Inset left="4px">
              <Columns>
                <Column width="content">
                  <StepButton
                    onPress={() =>
                      duration > 1 ? onChangeDuration(duration - 1) : undefined
                    }
                    type="decrement"
                  />
                </Column>
                <Box>
                  <Text align="center" size="16px" weight="heavy">
                    {duration} year{duration > 1 ? 's' : ''}
                  </Text>
                </Box>
                <Column width="content">
                  <StepButton
                    onPress={() =>
                      duration < maxDuration
                        ? onChangeDuration(duration + 1)
                        : undefined
                    }
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
              Registration cost
            </Text>
          </Column>
          <Column width="1/3">
            <Text align="right" color="secondary80" size="16px" weight="bold">
              {registrationFee}
            </Text>
          </Column>
        </Columns>
        <Columns>
          <Column width="2/3">
            <Text color="secondary80" size="16px" weight="bold">
              Estimated network fee
            </Text>
          </Column>
          <Column width="1/3">
            <Text align="right" color="secondary80" size="16px" weight="bold">
              {networkFee}
            </Text>
          </Column>
        </Columns>
        <Columns>
          <Column width="2/3">
            <Text size="16px" weight="heavy">
              Total cost
            </Text>
          </Column>
          <Column width="1/3">
            <Text align="right" size="16px" weight="heavy">
              {totalCost}
            </Text>
          </Column>
        </Columns>
      </Stack>
    </Box>
  );
}
