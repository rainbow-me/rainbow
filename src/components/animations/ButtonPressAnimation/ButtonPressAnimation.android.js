import React from 'react';
import { View } from 'react-native';
import {
  TouchableNativeFeedback,
  TouchableOpacity,
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
  testID,
}) {
  if (disabled) {
    return <View style={style}>{children}</View>;
  }
  if (opacityTouchable) {
    return (
      <TouchableOpacity
        disabled={disabled}
        onLongPress={onLongPress}
        onPress={onPress}
        onPressStart={onPressStart}
        style={style}
        testID={testID}
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
        testID={testID}
        {...wrapperProps}
      >
        <View pointerEvents="box-only" style={style}>
          {children}
        </View>
      </TouchableNativeFeedback>
    </Wrapper>
  );
}
