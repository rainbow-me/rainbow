import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { withHandlers } from 'recompact';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { Centered } from '../layout';
import { colors, position, shadow } from '../../styles';
import { ShadowStack } from '../shadow-stack';

const FloatingActionButtonBorderRadius = 27;

const Container = styled(Centered)`
  ${position.cover}
  background-color: ${({ disabled }) => (disabled ? '#F6F7F9' : colors.blue)};
  border-radius: ${FloatingActionButtonBorderRadius};
  overflow: hidden;
`;

const InnerBorder = styled.View`
  ${position.cover}
  border-color: ${colors.alpha(colors.black, 0.06)};
  border-radius: ${FloatingActionButtonBorderRadius};
  border-width: 0.5;
`;

const buildFabShadow = disabled => (disabled ? [] : [
  shadow.buildString(0, 1, 18, colors.alpha(colors.purple, 0.12)),
  shadow.buildString(0, 3, 5, colors.alpha(colors.purple, 0.2)),
  shadow.buildString(0, 6, 10, colors.alpha(colors.purple, 0.14)),
]);

const enhance = withHandlers({
  onPress: ({ onPress }) => (event) => {
    ReactNativeHapticFeedback.trigger('impactLight');
    if (onPress) onPress(event);
  },
  onPressIn: ({ onPressIn }) => (event) => {
    ReactNativeHapticFeedback.trigger('impactLight');
    if (onPressIn) onPressIn(event);
  },
});

const FloatingActionButton = enhance(({
  children,
  disabled,
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
  >
    <ShadowStack
      {...position.sizeAsObject(size)}
      borderRadius={FloatingActionButtonBorderRadius}
      shadows={buildFabShadow(disabled)}
    >
      <Container {...props} disabled={disabled}>
        <Fragment>
          {(typeof children === 'function')
            ? children({ size })
            : children
          }
          {!disabled && <InnerBorder />}
        </Fragment>
      </Container>
    </ShadowStack>
  </ButtonPressAnimation>
));

FloatingActionButton.propTypes = {
  children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
  onPressIn: PropTypes.func,
  onPressOut: PropTypes.func,
  size: PropTypes.number,
};

FloatingActionButton.size = 54;

FloatingActionButton.defaultProps = {
  size: FloatingActionButton.size,
};

export default FloatingActionButton;
