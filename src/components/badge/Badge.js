import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-primitives';
import { animated, interpolate, Transition } from 'react-spring/dist/native';
import {
  compose,
  defaultProps,
  onlyUpdateForKeys,
  withProps,
} from 'recompact';
import styled, { css } from 'styled-components/primitives';
import {
  animations,
  borders,
  colors,
  padding,
} from '../../styles';
import { Centered } from '../layout';
import { Text } from '../text';

const AnimatedView = animated(View);

const Container = styled(Centered)`
  height: ${({ size }) => size};
  position: absolute;
  right: ${({ offset }) => (offset * -1)};
  top: ${({ offset }) => (offset * -1)};
`;

const MultiDigitValue = css`
  ${padding(2, 5.5, 3)}
  transform: translateX(${({ offset }) => (Math.floor(offset / 2))}px);
`;

const SingleDigitValue = css`
  ${({ size }) => borders.buildCircle(size)}
  ${padding(2, 0, 3)}
`;

const Circle = styled(Centered)`
  ${({ valueLength }) => (
    (valueLength === 1)
      ? SingleDigitValue
      : MultiDigitValue
  )}
  background-color: ${colors.primaryBlue};
  border-radius: 15;
`;

const interpolateTransform = ({ scale, translateY }) => ({
  transform: [
    { scale: interpolate([scale], s => s) },
    { translateY: interpolate([translateY], y => y) },
  ],
});

const Badge = ({ delay, value, ...props }) => (
  <Container {...props}>
    <Transition
      config={animations.spring.badge}
      delay={delay}
      enter={animations.keyframes.badge.to}
      from={animations.keyframes.badge.from}
      leave={animations.keyframes.badge.from}
      native
    >
      {springValues => (
        <AnimatedView style={interpolateTransform(springValues)}>
          <Circle {...props}>
            <Text color="white" size="smaller" weight="semibold">
              {value}
            </Text>
          </Circle>
        </AnimatedView>
      )}
    </Transition>
  </Container>
);

Badge.propTypes = {
  delay: PropTypes.number,
  maxLength: PropTypes.number,
  offset: PropTypes.number,
  size: PropTypes.number,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  valueLength: PropTypes.number,
};

Badge.defaultProps = {
  offset: 7,
  size: 19,
};

export default compose(
  defaultProps({ maxLength: 2 }),
  onlyUpdateForKeys(['value']),
  withProps(({ value }) => ({ valueLength: value.toString().length })),
  withProps(({ maxLength, value, valueLength }) => ({
    value: (valueLength > maxLength) ? `${'9'.repeat(maxLength)}+` : value,
  })),
)(Badge);
