import React from 'react';
import styled from 'styled-components/primitives';
import { Text } from '../text';
import { colors } from '@rainbow-me/styles';

const TimestampTextElement = styled(Text).attrs({
  align: 'center',
  color: colors.blueGreyDark50,
  letterSpacing: 'roundedTight',
  size: 'smedium',
  weight: 'semibold',
})`
  margin-left: -15;
  transform: translateX(${({ translateX }) => translateX}px);
`;

const TimestampText = ({ translateX, value }) => (
  <TimestampTextElement translateX={translateX}>{value}</TimestampTextElement>
);

export default React.memo(TimestampText);
