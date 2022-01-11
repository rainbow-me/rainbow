import React from 'react';
import { View } from 'react-native';
import DropShadow from 'react-native-drop-shadow';

const buildShadow = (
  width = 0,
  height = 0,
  radius,
  shadowColor = '#000000',
  shadowOpacity = 0.4
) => ({
  shadowColor,
  shadowOffset: {
    height: height / 2,
    width,
  },
  shadowOpacity: shadowOpacity / 1.5,
  shadowRadius: radius / 4,
});

export default function AndroidShadow({
  adjustHeightForRadius,
  adjustWidthForRadius,
  backgroundColor,
  borderRadius,
  shadows,
  width,
  radius,
  opacity,
  height,
  index = 0,
}) {
  const noMoreShadowsToApply = index > shadows.length - 1;
  if (noMoreShadowsToApply) {
    return (
      <View
        style={[
          {
            backgroundColor: backgroundColor || '#ffffff',
            borderRadius,
            height,
            opacity,
            width,
          },
        ]}
      />
    );
  }

  const shadow = shadows[index];
  return (
    <DropShadow
      style={[
        {
          alignItems: 'center',
          borderRadius,
          height: adjustHeightForRadius ? height + radius : height,
          justifyContent: 'center',
          opacity,
          paddingHorizontal: !adjustHeightForRadius ? 4 : undefined,
          position: 'absolute',
          width: adjustWidthForRadius ? width + radius : width,
          ...buildShadow(...shadow),
        },
      ]}
    >
      <AndroidShadow
        backgroundColor={backgroundColor}
        borderRadius={borderRadius}
        height={height}
        index={index + 1}
        opacity={opacity}
        radius={radius}
        shadows={shadows}
        width={width}
      />
    </DropShadow>
  );
}
