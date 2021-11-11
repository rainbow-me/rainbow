import { upperFirst } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { Row } from '../layout';
import { Text } from '../text';
import GasSpeedEmoji from './GasSpeedEmoji';

const GasSpeedLabel = styled(Text).attrs({
  lineHeight: 'normal',
  size: 'lmedium',
  weight: 'heavy',
})``;

const GasSpeedLabelPagerItem = ({ label, theme }) => {
  const { colors } = useTheme();

  return (
    <Row>
      <GasSpeedEmoji label={label} />
      <GasSpeedLabel
        color={
          theme !== 'light'
            ? colors.whiteLabel
            : colors.alpha(colors.blueGreyDark, 0.8)
        }
      >
        {upperFirst(label)}
      </GasSpeedLabel>
    </Row>
  );
};

export default React.memo(GasSpeedLabelPagerItem);
