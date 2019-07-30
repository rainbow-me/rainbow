import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { View } from 'react-primitives';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { ButtonPressAnimation } from '../animations';
import InnerBorder from '../InnerBorder';
import { borders, colors, position } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { ShadowStack } from '../shadow-stack';

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
    size: PropTypes.number,
    tapRef: PropTypes.object,
  }

  static defaultProps = {
    scaleTo: 0.82,
    size: FabSize,
  }

  static size = FabSize

  static sizeWhileDragging = 74

  static shadow = FabShadow

  shouldComponentUpdate = nextProps => (
    isNewValueForPath(this.props, nextProps, 'disabled')
    || isNewValueForPath(this.props, nextProps, 'isFabSelectionValid')
    || isNewValueForPath(this.props, nextProps, 'scaleTo')
  )

  handlePress = (event) => {
    const { onPress } = this.props;
    ReactNativeHapticFeedback.trigger('impactLight');
    if (onPress) onPress(event);
  }

  handlePressIn = (event) => {
    const { onPressIn } = this.props;
    ReactNativeHapticFeedback.trigger('impactLight');
    if (onPressIn) onPressIn(event);
  }

  render = () => {
    const {
      backgroundColor,
      children,
      disabled,
      isFabSelectionValid,
      scaleTo,
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
        {...props}
      >
        <ShadowStack
          {...borders.buildCircleAsObject(size)}
          shadows={FabShadow}
          shadowProps={{ opacity: isDisabled ? 0 : 1 }}
        >
          <View
            {...position.centeredAsObject}
            {...position.coverAsObject}
            backgroundColor={isDisabled ? colors.grey : backgroundColor}
            disabled={disabled}
            isFabSelectionValid={isFabSelectionValid}
          >
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
          </View>
        </ShadowStack>
      </ButtonPressAnimation>
    );
  }
}
