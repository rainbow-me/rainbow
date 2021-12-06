import MaskedView from '@react-native-community/masked-view';
import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Text from './Text';

const GradientText = ({
  angle,
  angleCenter,
  children,
  colors,
  end,
  renderer,
  start,
  steps,
  ...props
}: any) => {
  const textElement =
    Array.isArray(children) || typeof children === 'string'
      ? createElement(renderer, { ...props, children })
      : children;

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <MaskedView maskElement={textElement}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <LinearGradient
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        angle={android && angle === false ? 45 : angle}
        angleCenter={angleCenter}
        colors={colors}
        end={end}
        locations={steps}
        start={start}
        useAngle={!!angle}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
