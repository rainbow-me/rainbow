import React, { ReactElement, useMemo } from 'react';
import { StyleProp, TextStyle, View, ViewStyle } from 'react-native';
import { IS_IOS } from '@/env';
import { opacity } from '@/__swaps__/utils/swaps';
import { useColorMode } from '../../color/ColorMode';
import { useForegroundColor } from '../../color/useForegroundColor';
import { Text, TextProps } from '../Text/Text';

export interface TextShadowProps {
  blur?: number;
  children: ReactElement<TextProps>;
  color?: string;
  containerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  enableInLightMode?: boolean;
  enableOnAndroid?: boolean;
  shadowOpacity?: number;
  textStyle?: StyleProp<TextStyle>;
  x?: number;
  y?: number;
}

export const TextShadow = ({
  blur = 16,
  children,
  color,
  containerStyle,
  disabled,
  enableInLightMode,
  enableOnAndroid,
  shadowOpacity = 0.6,
  textStyle,
  x = 0,
  y = 0,
}: TextShadowProps) => {
  const { isDarkMode } = useColorMode();

  const inferredTextColor = useForegroundColor(children.props.color ?? 'label');
  const inferredTextSize = children.props.size || '17pt';

  const [internalContainerStyle, internalTextStyle] = useMemo(() => {
    const extraSpaceForShadow = blur + Math.max(Math.abs(x), Math.abs(y));
    return [
      { margin: -extraSpaceForShadow },
      {
        textShadowColor: opacity(color || inferredTextColor, shadowOpacity),
        textShadowOffset: { width: x, height: y },
        textShadowRadius: blur,
        padding: extraSpaceForShadow,
      },
    ];
  }, [blur, color, inferredTextColor, shadowOpacity, x, y]);

  return !disabled && (IS_IOS || enableOnAndroid) && (isDarkMode || enableInLightMode) ? (
    <View style={[containerStyle, internalContainerStyle]}>
      <Text color={{ custom: 'transparent' }} size={inferredTextSize} style={[textStyle, internalTextStyle]} weight="bold">
        {children}
      </Text>
    </View>
  ) : (
    <>{children}</>
  );
};
