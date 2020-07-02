import React from 'react';
import { magicMemo } from '../../../utils';
import { Row } from '../../layout';
import { Text } from '../../text';
import { colors } from '@rainbow-me/styles';

const DetailsRow = ({ label, value, ...props }) => (
  <Row {...props} align="center" justify="space-between">
    <Text flex={0} size="lmedium">
      {label}
    </Text>
    <Text
      align="right"
      color={colors.alpha(colors.dark, 0.6)}
      letterSpacing="roundedTight"
      size="lmedium"
    >
      {value}
    </Text>
  </Row>
);

export default magicMemo(DetailsRow, ['label', 'value']);
