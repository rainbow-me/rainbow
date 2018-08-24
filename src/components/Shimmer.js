import PropTypes from 'prop-types';
import React from 'react';
import ShimmerPlaceHolder from 'react-native-shimmer-placeholder';
import styled from 'styled-components/primitives';
import { colors, position } from '../styles';

const ShimmerElement = styled(ShimmerPlaceHolder)`
  ${position.cover}
  background-color: ${colors.transparent};
`;

const generateColorShimmerTheme = (color, opacity) => ([
  colors.alpha(color, opacity * 0.333),
  colors.alpha(color, opacity),
  colors.alpha(color, opacity * 0.333),
]);

const Shimmer = ({
  autoRun,
  backgroundColorBehindBorder,
  color,
  duration,
  height,
  opacity,
  width,
  ...props
}) => (
  <ShimmerElement
    {...props}
    autoRun={autoRun}
    backgroundColorBehindBorder={backgroundColorBehindBorder}
    colorShimmer={generateColorShimmerTheme(color, opacity)}
    duration={duration}
    height={height}
    width={width}
  />
);

Shimmer.propTypes = {
  autoRun: PropTypes.bool,
  backgroundColorBehindBorder: PropTypes.string,
  color: PropTypes.string,
  duration: PropTypes.number,
  height: PropTypes.number.isRequired,
  opacity: PropTypes.number,
  width: PropTypes.number.isRequired,
};

Shimmer.defaultProps = {
  autoRun: true,
  backgroundColorBehindBorder: colors.transparent,
  color: colors.white,
  duration: 1000,
  opacity: 0.2,
};

export default Shimmer;
