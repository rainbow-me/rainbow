import React from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import {
  Box,
  Column,
  Columns,
  DebugLayout,
  Inline,
  Inset,
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';

export default function ReviewRegistration({
  duration,
  onChangeDuration,
  networkFee,
  totalCost,
  registrationCost,
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
            <Inset horizontal="4px">
              <Columns>
                <Column width="content">
                  <Box
                    as={ButtonPressAnimation}
                    onPress={() => onChangeDuration(duration - 1)}
                    scaleTo={0.75}
                  >
                    <Text color="action" weight="heavy">
                      {false ? '􀁍' : '􀁏'}
                    </Text>
                  </Box>
                </Column>
                <Box>
                  <Text align="center" size="16px" weight="heavy">
                    {duration} years
                  </Text>
                </Box>
                <Column width="content">
                  <Box
                    as={ButtonPressAnimation}
                    onPress={() => onChangeDuration(duration + 1)}
                    scaleTo={0.75}
                  >
                    <Text color="action" weight="heavy">
                      {true ? '􀁍' : '􀁏'}
                    </Text>
                  </Box>
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
              {registrationCost?.display}
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
              {networkFee?.display}
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
              {totalCost?.display}
            </Text>
          </Column>
        </Columns>
      </Stack>
    </Box>
  );
}
