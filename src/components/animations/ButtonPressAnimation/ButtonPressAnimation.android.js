import React from 'react';
import { View } from 'react-native';
import {
  TouchableNativeFeedback,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';

const RadiusWrapper = styled.View`
  border-radius: ${({ borderRadius }) => borderRadius};
  overflow: hidden;
`;

const Wrapper = ({ children, radius, style }) =>
  radius ? (
    <RadiusWrapper borderRadius={radius} style={style}>
      {children}
    </RadiusWrapper>
  ) : (
    children
  );

export default function ButtonPressAnimation({
  children,
  disabled,
  elevation,
  onLongPress,
  onPress,
  onPressStart,
  style,
  opacityTouchable = false,
  wrapperProps,
  radiusAndroid: radius,
  radiusWrapperStyle,
  enablePressWhileDisabled = false,
}) {
  if (disabled) {
    return (
      <TouchableWithoutFeedback
        onPress={enablePressWhileDisabled ? onPress : null}
        style={style}
      >
        {children}
      </TouchableWithoutFeedback>
    );
  }
  if (opacityTouchable) {
    return (
      <TouchableOpacity
        disabled={disabled}
        onLongPress={onLongPress}
        onPress={onPress}
        onPressStart={onPressStart}
        style={style}
        {...wrapperProps}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <Wrapper
      radius={radius}
      style={[radiusWrapperStyle, elevation ? { elevation } : null]}
    >
      <TouchableNativeFeedback
        background={TouchableNativeFeedback.Ripple('#CCCCCC')}
        disabled={disabled}
        onLongPress={onLongPress}
        onPress={onPress}
        onPressStart={onPressStart}
        {...wrapperProps}
      >
        <View pointerEvents="box-only" style={style}>
          {children}
        </View>
      </TouchableNativeFeedback>
    </Wrapper>
  );
}
