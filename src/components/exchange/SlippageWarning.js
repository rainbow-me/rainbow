import AnimateNumber from '@bankify/react-native-animate-number';
import React from 'react';
import styled from 'styled-components';
import { convertBipsToPercentage } from '../../helpers/utilities';
import { Icon } from '../icons';
import { Row, RowWithMargins } from '../layout';
import { AnimatedNumber as AnimatedNumberAndroid, Text } from '../text';
import { padding } from '@rainbow-me/styles';

export const SlippageWarningThresholdInBips = 500;
const SevereSlippageThresholdInBips = SlippageWarningThresholdInBips * 2;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(19, 19, 2)};
  flex-shrink: 0;
  width: 100%;
`;

const formatSlippage = slippage =>
  slippage ? convertBipsToPercentage(slippage, 1) : 0;

const renderSlippageText = displayValue => (
  <Text color="whiteLabel" size="smedium" weight="semibold">
    {`${displayValue}% premium`}
  </Text>
);

const AnimatedNumberComponent = ios ? AnimateNumber : AnimatedNumberAndroid;

const SlippageWarning = ({ slippage }) => {
  const { colors } = useTheme();
  const isSevere = slippage >= SevereSlippageThresholdInBips;
  const severityColor = isSevere ? colors.red : colors.orangeLight;
  const showWarning = slippage >= SlippageWarningThresholdInBips;
  return showWarning ? (
    <Container>
      <RowWithMargins align="center" margin={5}>
        <Icon color={severityColor} name="warning" size="lmedium" />
        <AnimatedNumberComponent
          formatter={formatSlippage}
          interval={1}
          renderContent={renderSlippageText}
          steps={12}
          timing="linear"
          value={slippage}
        />
      </RowWithMargins>
      <Text color={severityColor} size="smedium" weight="medium">
        {isSevere ? 'Please swap less' : 'Consider swapping less'}
      </Text>
    </Container>
  ) : null;
};

export default SlippageWarning;
