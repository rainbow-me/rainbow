/* eslint-disable no-nested-ternary */
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { compose, pure, withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import InnerBorder from '../InnerBorder';
import { Centered } from '../layout';
import { borders, colors, position } from '../../styles';
import { ShadowStack } from '../shadow-stack';

const Container = styled(Centered)`
  ${position.cover}
  background-color: ${({ disabled, greyed }) => (disabled ? '#F6F7F9' : (greyed ? colors.grey : colors.paleBlue))};
`;

const buildFabShadow = disabled => (
  disabled
    ? []
    : [
      [0, 3, 5, colors.dark, 0.2],
      [0, 6, 10, colors.dark, 0.14],
      [0, 1, 18, colors.dark, 0.12],
    ]
);

const enhance = compose(
  pure,
  withHandlers({
    onPress: ({ onPress }) => (event) => {
      ReactNativeHapticFeedback.trigger('impactLight');
      if (onPress) onPress(event);
    },
    onPressIn: ({ onPressIn }) => (event) => {
      ReactNativeHapticFeedback.trigger('impactLight');
      if (onPressIn) onPressIn(event);
    },
  }),
);

const FloatingActionButton = enhance(({
  children,
  disabled,
  greyed,
  onPress,
  onPressIn,
  onPressOut,
  size,
  style,
  ...props
}) => (
  <ButtonPressAnimation
    disabled={disabled}
    onPress={onPress}
    onPressIn={onPressIn}
    onPressOut={onPressOut}
    style={style}
    {...props}
  >
    <ShadowStack
      {...borders.buildCircleAsObject(size)}
      backgroundColor={(disabled || greyed) ? '#F6F7F9' : colors.paleBlue}
      shadows={buildFabShadow(disabled || greyed)}
    >
      <Container {...props} disabled={disabled} greyed={greyed}>
        <Fragment>
          {(typeof children === 'function')
            ? children({ size })
            : children
          }
          {!disabled && (
            <InnerBorder
              opacity={0.06}
              radius={size / 2}
            />
          )}
        </Fragment>
      </Container>
    </ShadowStack>
  </ButtonPressAnimation>
));

FloatingActionButton.propTypes = {
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  disabled: PropTypes.bool,
  greyed: PropTypes.bool,
  onPress: PropTypes.func,
  onPressIn: PropTypes.func,
  onPressOut: PropTypes.func,
  size: PropTypes.number,
  tapRef: PropTypes.object,
};

FloatingActionButton.size = 56;

FloatingActionButton.defaultProps = {
  size: FloatingActionButton.size,
};

export default FloatingActionButton;
