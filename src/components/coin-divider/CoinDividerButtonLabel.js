import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
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
      color="blueGreyDark"
      letterSpacing="tighter"
      size="lmedium"
      style={{
        opacity: 0.6,
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
