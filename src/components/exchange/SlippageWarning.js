import AnimateNumber from '@bankify/react-native-animate-number';
import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  onlyUpdateForKeys,
  withProps,
} from 'recompact';
import styled from 'styled-components/primitives';
import { colors, padding } from '../../styles';
import { Icon } from '../icons';
import { Row, RowWithMargins } from '../layout';
import { Text } from '../text';

const SevereSlippageThreshold = 10;

const Container = styled(Row).attrs({
  align: 'center',
  justify: 'space-between',
})`
  ${padding(19, 19, 2)};
  flex-shrink: 0;
  width: 100%;
`;

const formatSlippage = (slippage) => (
  slippage
    ? parseFloat(slippage).toFixed(1)
    : 0
);

const renderSlippageText = (displayValue) => (
  <Text color="white" size="smedium" weight="semibold">
    {`${displayValue}% premium`}
  </Text>
);

const enhance = compose(
  onlyUpdateForKeys(['slippage']),
  withProps(({ slippage }) => {
    const fixedSlippage = formatSlippage(slippage);
    const isSevere = fixedSlippage > SevereSlippageThreshold;

    return {
      isSevere,
      severityColor: isSevere ? colors.brightRed : colors.brightOrange,
      slippage: fixedSlippage,
    };
  }),
);

const SlippageWarning = enhance(({
  isSevere,
  severityColor,
  slippage,
}) => (
  (slippage < (SevereSlippageThreshold / 2))
    ? null
    : (
      <Container>
        <RowWithMargins align="center" margin={5}>
          <Icon
            color={severityColor}
            name="warning"
            size="lmedium"
          />
          <AnimateNumber
            formatter={formatSlippage}
            interval={1}
            renderContent={renderSlippageText}
            steps={12}
            timing="linear"
            value={slippage}
          />
        </RowWithMargins>
        <Text color={severityColor} size="smedium" weight="medium">
          {isSevere
            ? 'Please swap less'
            : 'Consider swapping less'
          }
        </Text>
      </Container>
    )
));

SlippageWarning.propTypes = {
  isSevere: PropTypes.bool,
  onPress: PropTypes.func,
  severityColor: PropTypes.string,
  slippage: PropTypes.string,
};

export default SlippageWarning;
