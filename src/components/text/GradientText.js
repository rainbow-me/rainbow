import MaskedView from '@react-native-masked-view/masked-view';
import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Text from './Text';

const GradientText = ({ angle, angleCenter, children, colors, end, renderer, start, steps, ...props }) => {
  const textElement =
    Array.isArray(children) || typeof children === 'string'
      ? // eslint-disable-next-line react/no-children-prop
        createElement(renderer, { ...props, children })
      : children;

  return (
    <MaskedView maskElement={textElement}>
      <LinearGradient
        angle={android && angle === false ? 45 : angle}
        angleCenter={angleCenter}
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
  children: PropTypes.node,
  colors: PropTypes.arrayOf(PropTypes.string),
  renderer: PropTypes.func,
  steps: PropTypes.arrayOf(PropTypes.number),
};

GradientText.defaultProps = {
  angleCenter: { x: 0.5, y: 0.5 },
  colors: ['#2CCC00', '#FEBE44'],
  end: { x: 1, y: 0.5 },
  renderer: Text,
  start: { x: 0, y: 0.5 },
  steps: [0.72, 1],
};

export default GradientText;
