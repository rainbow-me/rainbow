import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { colors } from '../../styles';
import { OpacityToggler } from '../animations';
import { Text } from '../text';

const CoinDividerButtonLabel = ({ isVisible, label, node, steps }) => (
  <OpacityToggler
    animationNode={node}
    endingOpacity={steps[1]}
    isVisible={isVisible}
    startingOpacity={steps[0]}
  >
    <Text
      color={colors.alpha(colors.blueGreyDark, 0.6)}
      letterSpacing="roundedTight"
      size="lmedium"
      style={{
        position: 'absolute',
        top: -10.25,
      }}
      weight="semibold"
    >
      {label}
    </Text>
  </OpacityToggler>
);

CoinDividerButtonLabel.propTypes = {
  isVisible: PropTypes.bool,
  label: PropTypes.string,
  node: PropTypes.any,
  steps: PropTypes.arrayOf(PropTypes.number),
};

export default onlyUpdateForKeys(['isVisible'])(CoinDividerButtonLabel);
