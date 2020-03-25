import MaskedView from '@react-native-community/masked-view';
import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Text from './Text';

const GradientText = ({
  angle,
  colors,
  end,
  renderer,
  start,
  steps,
  ...props
}) => {
  const textElement = createElement(renderer, props);

  return (
    <MaskedView maskElement={textElement}>
      <LinearGradient
        angle={angle}
        angleCenter={{ x: 0.5, y: 0.5 }}
        colors={colors}
        end={end}
        locations={steps}
        start={start}
        useAngle={!!angle}
      >
        <View opacity={0}>{textElement}</View>
      </LinearGradient>
    </MaskedView>
  );
};

GradientText.propTypes = {
  angle: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  colors: PropTypes.arrayOf(PropTypes.string),
  renderer: PropTypes.func,
  steps: PropTypes.arrayOf(PropTypes.number),
};

GradientText.defaultProps = {
  colors: ['#2CCC00', '#FEBE44'],
  end: { x: 1, y: 0.5 },
  renderer: Text,
  start: { x: 0, y: 0.5 },
  steps: [0.72, 1],
};

export default GradientText;
