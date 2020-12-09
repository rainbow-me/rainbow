import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder, RowWithMargins } from '../layout';
import { Text } from '../text';
import { colors, padding, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const shadows = {
  default: [
    [0, 2, 5, colors.dark, 0.15],
    [0, 6, 10, colors.dark, 0.14],
    [0, 1, 18, colors.dark, 0.08],
  ],
  disabled: [
    [0, 2, 6, colors.dark, 0.06],
    [0, 3, 9, colors.dark, 0.08],
  ],
};

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 5,
})`
  ${padding(0, 9)};
  border-radius: 15px;
  height: 30;
  z-index: 1;
`;

export default function MiniButton({
  borderRadius = 15,
  children,
  disabled,
  onPress,
  scaleTo = 1.1,
  width,
  height,
  ...props
}) {
  return (
    <ButtonPressAnimation
      disabled={disabled}
      onPress={onPress}
      radiusAndroid={borderRadius}
      scaleTo={scaleTo}
      {...props}
    >
      <View style={{ borderRadius, overflow: 'hidden' }}>
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={disabled ? colors.lightGrey : colors.appleBlue}
          borderRadius={borderRadius}
          height={height}
          shadows={disabled ? shadows.disabled : shadows.default}
          width={width}
        />
        <Content>
          {typeof children === 'string' ? (
            <Text color="white" weight="semibold">
              {children}
            </Text>
          ) : (
            children
          )}
        </Content>
        <InnerBorder radius={borderRadius} />
      </View>
    </ButtonPressAnimation>
  );
}
