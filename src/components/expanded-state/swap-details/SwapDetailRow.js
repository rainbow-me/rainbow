import React from 'react';
import { magicMemo } from '../../../utils';
import { Row } from '../../layout';
import { Text } from '../../text';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

const DetailsRow = ({ label, value, ...props }) => (
  <Row {...props} align="center" justify="space-between">
    <Text flex={0} size="lmedium">
      {label}
    </Text>
    <Text
      align="right"
      color={colors_NOT_REACTIVE.alpha(colors_NOT_REACTIVE.dark, 0.6)}
      letterSpacing="roundedTight"
      size="lmedium"
    >
      {value}
    </Text>
  </Row>
);

export default magicMemo(DetailsRow, ['label', 'value']);
