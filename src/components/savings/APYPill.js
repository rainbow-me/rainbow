import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import RadialGradient from 'react-native-radial-gradient';
import { colors, position } from '../../styles';
import { Centered } from '../layout';
import { GradientText } from '../text';

const sx = StyleSheet.create({
  container: {
    height: 30,
    paddingBottom: 1,
    paddingHorizontal: 10,
  },
  containerSmall: {
    height: 21,
    paddingHorizontal: 6,
    transform: [{ translateX: -6 }],
  },
  gradient: {
    ...position.coverAsObject,
    overflow: 'hidden',
  },
});

const gradientColors = ['#2CCC00', '#FEBE44'];
const gradientProps = {
  pointerEvents: 'none',
  style: sx.gradient,
};

const linearGradientProps = {
  ...gradientProps,
  end: { x: 1, y: 1 },
  start: { x: 0, y: 0 },
};

const radialGradientProps = {
  ...gradientProps,
  center: [0, 1],
  colors: [
    colors.alpha(gradientColors[0], 0.1),
    colors.alpha(gradientColors[1], 0.08),
  ],
};

const textProps = {
  end: { x: 1, y: 1 },
  start: { x: 0, y: 0 },
  steps: [0, 1],
};

const APYPill = ({ small, value }) => (
  <Centered style={small ? sx.containerSmall : sx.container}>
    {small ? (
      <RadialGradient {...radialGradientProps} borderRadius={21} radius={81} />
    ) : (
      <LinearGradient
        {...linearGradientProps}
        borderRadius={17}
        colors={gradientColors}
        opacity={0.1}
      />
    )}
    <GradientText
      {...textProps}
      align="center"
      angle={false}
      letterSpacing="roundedTight"
      size={small ? 'smedium' : 'lmedium'}
      weight="semibold"
    >
      {value}% APY
    </GradientText>
  </Centered>
);

APYPill.propTypes = {
  small: PropTypes.bool,
  value: PropTypes.node,
};

export default React.memo(APYPill);
