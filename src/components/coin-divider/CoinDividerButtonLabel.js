import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { magicMemo } from '../../utils';
import { OpacityToggler } from '../animations';
import { Text } from '../text';

const LabelText = styled(Text).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  weight: 'semibold',
})`
  position: absolute;
  top: -10.25;
`;

const CoinDividerButtonLabel = ({ isVisible, label, node, steps }) => (
  <OpacityToggler
    animationNode={node}
    endingOpacity={steps[1]}
    isVisible={isVisible}
    startingOpacity={steps[0]}
  >
    <LabelText>{label}</LabelText>
  </OpacityToggler>
);

CoinDividerButtonLabel.propTypes = {
  isVisible: PropTypes.bool,
  label: PropTypes.string,
  node: PropTypes.any,
  steps: PropTypes.arrayOf(PropTypes.number),
};

export default magicMemo(CoinDividerButtonLabel, 'isVisible');
