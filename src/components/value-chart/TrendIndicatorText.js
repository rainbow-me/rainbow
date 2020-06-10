import PropTypes from 'prop-types';
import React from 'react';
import { colors } from '../../styles';
import { Icon } from '../icons';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

const TrendIndicatorText = ({ children, direction }) => (
  <RowWithMargins align="center" margin={2}>
    <Icon
      color={direction ? colors.chartGreen : colors.red}
      direction={direction ? 'left' : 'right'}
      name="arrow"
    />
    <Text
      color={direction ? colors.chartGreen : colors.red}
      lineHeight={17}
      weight="semibold"
    >
      {children}
    </Text>
  </RowWithMargins>
);

TrendIndicatorText.propTypes = {
  children: PropTypes.string,
  direction: PropTypes.bool,
};

export default React.memo(TrendIndicatorText);
