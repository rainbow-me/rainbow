import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import ShadowStack from 'react-native-shadow-stack';
import { View } from 'react-primitives';
import { borders, colors, position } from '../../styles';
import { isNewValueForObjectPaths } from '../../utils';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import { InnerBorder } from '../layout';

const FabSize = 56;
const FabShadow = [
  [0, 2, 5, colors.dark, 0.2],
  [0, 6, 10, colors.dark, 0.14],
  [0, 1, 18, colors.dark, 0.12],
];

export default class FloatingActionButton extends Component {
  static propTypes = {
    backgroundColor: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.func, PropTypes.node]),
    disabled: PropTypes.bool,
    isFabSelectionValid: PropTypes.bool,
    onPress: PropTypes.func,
    onPressIn: PropTypes.func,
    scaleTo: PropTypes.number,
    shadows: PropTypes.arrayOf(PropTypes.array),
    size: PropTypes.number,
    tapRef: PropTypes.object,
  };

  static defaultProps = {
    scaleTo: 0.86,
    shadows: FabShadow,
    size: FabSize,
  };

  shouldComponentUpdate = nextProps =>
    isNewValueForObjectPaths(this.props, nextProps, [
      'disabled',
      'isFabSelectionValid',
      'scaleTo',
    ]);

  static size = FabSize;

  static sizeWhileDragging = 74;

  static shadow = FabShadow;

  handlePress = event => {
    const { onPress } = this.props;
    ReactNativeHapticFeedback.trigger('impactLight');
    if (onPress) onPress(event);
  };

  handlePressIn = event => {
    const { onPressIn } = this.props;
    ReactNativeHapticFeedback.trigger('impactLight');
    if (onPressIn) onPressIn(event);
  };

  render = () => {
    const {
      backgroundColor,
      children,
      disabled,
      isFabSelectionValid,
      scaleTo,
      shadows,
      size,
      ...props
    } = this.props;

    const isDisabled = disabled || !isFabSelectionValid;

    return (
      <ButtonPressAnimation
        disabled={disabled}
        onPress={this.handlePress}
        onPressIn={this.handlePressIn}
        scaleTo={scaleTo}
        useLateHaptic={false}
        {...props}
      >
        <ShadowStack
          {...borders.buildCircleAsObject(size)}
          hideShadow={isDisabled}
          shadows={shadows}
        >
          <View
            {...position.centeredAsObject}
            {...position.coverAsObject}
            backgroundColor={isDisabled ? colors.grey : backgroundColor}
            disabled={disabled}
            isFabSelectionValid={isFabSelectionValid}
          >
            {typeof children === 'function' ? children({ size }) : children}
            {!disabled && <InnerBorder opacity={0.06} radius={size / 2} />}
          </View>
        </ShadowStack>
      </ButtonPressAnimation>
    );
  };
}
