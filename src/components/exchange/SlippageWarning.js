import AnimateNumber from '@bankify/react-native-animate-number';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { convertBipsToPercentage } from '../../helpers/utilities';
import { Icon } from '../icons';
import { Row, RowWithMargins } from '../layout';
import { AnimatedNumber as AnimatedNumberAndroid, Text } from '../text';
import { colors, padding } from '@rainbow-me/styles';

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
  <Text color="white" size="smedium" weight="semibold">
    {`${displayValue}% premium`}
  </Text>
);

const enhance = compose(
  onlyUpdateForKeys(['slippage']),
  withProps(({ slippage }) => {
    const isSevere = slippage >= SevereSlippageThresholdInBips;

    return {
      isSevere,
      severityColor: isSevere ? colors.red : colors.orangeLight,
      showWarning: slippage >= SlippageWarningThresholdInBips,
    };
  })
);

const AnimatedNumberComponent = ios ? AnimateNumber : AnimatedNumberAndroid;

const SlippageWarning = enhance(
  ({ isSevere, severityColor, showWarning, slippage }) =>
    showWarning ? (
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
    ) : null
);

SlippageWarning.propTypes = {
  isSevere: PropTypes.bool,
  onPress: PropTypes.func,
  severityColor: PropTypes.string,
  showWarning: PropTypes.bool,
  slippage: PropTypes.string,
};

export default SlippageWarning;
