import React from 'react';
import { View } from 'react-native';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder, RowWithMargins } from '../layout';
import { Text } from '../text';
import { colors, padding, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const shadows = {
  default: [[0, 4, 12, colors.appleBlue, 0.4]],
  disabled: [[0, 4, 12, colors.lightGrey, 0.4]],
};

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 5,
})`
  ${({ hasLeadingIcon }) => padding(0, 10, 1, hasLeadingIcon ? 6 : 10)};
  border-radius: 15px;
  height: 30;
  z-index: 1;
`;

export default function MiniButton({
  borderRadius = 15,
  children,
  disabled,
  hasLeadingIcon,
  onPress,
  scaleTo = 0.82,
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
      <View style={{ borderRadius }}>
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={disabled ? colors.lightGrey : colors.appleBlue}
          borderRadius={borderRadius}
          height={height}
          shadows={disabled ? shadows.disabled : shadows.default}
          width={width}
        />
        <Content hasLeadingIcon={hasLeadingIcon}>
          {typeof children === 'string' ? (
            <Text align="center" color="white" weight="bold">
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
