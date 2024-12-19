import React, { ReactElement, useMemo } from 'react';
import { View } from 'react-native';
import { IS_IOS } from '@/env';
import { opacity } from '@/__swaps__/utils/swaps';
import { useColorMode } from '../../color/ColorMode';
import { useForegroundColor } from '../../color/useForegroundColor';
import { AnimatedText, AnimatedTextProps } from '../Text/AnimatedText';
import { Text, TextProps } from '../Text/Text';

export interface TextShadowProps {
  blur?: number;
  children: ReactElement<TextProps | AnimatedTextProps>;
  color?: string;
  disabled?: boolean;
  enableInLightMode?: boolean;
  enableOnAndroid?: boolean;
  shadowOpacity?: number;
  x?: number;
  y?: number;
}

const isAnimatedTextChild = (child: ReactElement<TextProps | AnimatedTextProps>): child is ReactElement<AnimatedTextProps> => {
  return child.type === AnimatedText;
};

export const TextShadow = ({
  blur = 16,
  children,
  color,
  disabled,
  enableInLightMode,
  enableOnAndroid,
  shadowOpacity = 0.6,
  x = 0,
  y = 0,
}: TextShadowProps) => {
  const { isDarkMode } = useColorMode();

  const inferredTextColor = useForegroundColor(children.props.color ?? 'label');
  const isAnimatedText = isAnimatedTextChild(children);

  const [containerStyle, internalTextStyle] = useMemo(() => {
    const extraSpaceForShadow = blur + Math.max(Math.abs(x), Math.abs(y));
    return [
      // Container style
      { margin: -extraSpaceForShadow },

      // Text style
      {
        ...(isAnimatedText
          ? {
              marginBottom: -extraSpaceForShadow,
              marginLeft: -extraSpaceForShadow,
              marginRight: -extraSpaceForShadow,
              marginTop: -extraSpaceForShadow,
            }
          : {}),
        padding: extraSpaceForShadow,
        textShadowColor: opacity(color || inferredTextColor, shadowOpacity),
        textShadowOffset: { width: x, height: y },
        textShadowRadius: blur,
      },
    ];
  }, [blur, color, inferredTextColor, isAnimatedText, shadowOpacity, x, y]);

  return !disabled && (IS_IOS || enableOnAndroid) && (isDarkMode || enableInLightMode) ? (
    <>
      {isAnimatedText ? (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <AnimatedText {...children.props} style={[children.props.style, internalTextStyle]} />
      ) : (
        <View style={containerStyle}>
          <Text color={{ custom: 'transparent' }} size={children.props.size} style={internalTextStyle} weight={children.props.weight}>
            {children}
          </Text>
        </View>
      )}
    </>
  ) : (
    <>{children}</>
  );
};
