import { get } from 'lodash';
import React from 'react';
import styled from 'styled-components/primitives';
import { Button } from '../buttons';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Text } from '../text';
import { colors, position } from '@rainbow-me/styles';

const ClockIcon = styled(Icon).attrs({
  color: colors.white,
  name: 'clock',
})`
  ${position.size(14)};
  flex: 0;
  margin-right: 5;
`;

const FeeButton = styled(Button).attrs({
  backgroundColor: colors.white,
  borderColor: colors.dark,
  borderWidth: 1,
  opacity: 1,
  showShadow: false,
  size: 'small',
  textProps: { color: colors.alpha(colors.blueGreyDark, 0.6) },
  type: 'pill',
})``;

const TimeButton = styled(Button).attrs({
  backgroundColor: colors.blueGreyDark,
  borderWidth: 1,
  scaleTo: 0.96,
  size: 'small',
  type: 'pill',
})``;

export default function SendTransactionSpeed({
  gasPrice,
  nativeCurrencySymbol,
  onPressTransactionSpeed,
}) {
  const fee = get(
    gasPrice,
    'txFee.native.value.display',
    `${nativeCurrencySymbol}0.00`
  );
  const time = get(gasPrice, 'estimatedTime.display', '');

  return (
    <Row justify="space-between">
      <FeeButton onPress={onPressTransactionSpeed}>Fee: {fee}</FeeButton>
      <TimeButton onPress={onPressTransactionSpeed}>
        <ClockIcon />
        <Text color={colors.white} size="medium" weight="medium">
          Arrives in ~ {time}
        </Text>
      </TimeButton>
    </Row>
  );
}
