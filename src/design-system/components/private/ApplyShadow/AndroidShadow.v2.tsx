import React from 'react';
import { ViewStyle } from 'react-native';
import DropShadow from 'react-native-drop-shadow';

import type { ShadowItem } from './ApplyShadow';

export function AndroidShadow({
  backgroundColor,
  children,
  shadows,
  index = 0,
}: {
  backgroundColor: ViewStyle['backgroundColor'];
  children: React.ReactElement;
  shadows: ShadowItem[];
  index?: number;
}) {
  const noMoreShadowsToApply = index > shadows.length - 1;
  if (noMoreShadowsToApply) return children;

  const shadow = shadows[index];
  return (
    <DropShadow
      style={{
        backgroundColor,
        shadowColor: shadow.color,
        shadowOffset: shadow.offset,
        shadowOpacity: shadow.opacity,
        shadowRadius: (shadow.radius || 0) / 2,
      }}
    >
      <AndroidShadow
        backgroundColor={backgroundColor}
        index={index + 1}
        shadows={shadows}
      >
        {children}
      </AndroidShadow>
    </DropShadow>
  );
}
