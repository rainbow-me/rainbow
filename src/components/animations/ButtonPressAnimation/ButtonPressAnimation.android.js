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

const Wrapper = ({ children, radius }) =>
  radius ? (
    <RadiusWrapper borderRadius={radius}>{children}</RadiusWrapper>
  ) : (
    children
  );

export default function ButtonPressAnimation({
  children,
  disabled,
  onLongPress,
  onPress,
  onPressStart,
  style,
  opacityTouchable = false,
  wrapperStyle,
  radiusAndroid: radius,
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
      >
        {children}
      </TouchableOpacity>
    );
  }
  return (
    <Wrapper radius={radius}>
      <TouchableNativeFeedback
        background={TouchableNativeFeedback.Ripple('#CCCCCC')}
        disabled={disabled}
        onLongPress={onLongPress}
        onPress={onPress}
        onPressStart={onPressStart}
        style={wrapperStyle}
      >
        <View pointerEvents="box-only" style={style}>
          {children}
        </View>
      </TouchableNativeFeedback>
    </Wrapper>
  );
}
