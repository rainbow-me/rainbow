import React, { ReactElement, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { IS_IOS, IS_TEST } from '@/env';
import { opacity } from '@/__swaps__/utils/swaps';
import { useColorMode } from '../../color/ColorMode';
import { useForegroundColor } from '../../color/useForegroundColor';
import { AnimatedText, AnimatedTextProps } from '../Text/AnimatedText';
import { Text, TextProps } from '../Text/Text';

export interface TextShadowProps {
  blur?: number;
  children: ReactElement<TextProps | AnimatedTextProps>;
  color?: string;
  containerStyle?: StyleProp<ViewStyle>;
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
  containerStyle,
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

  const [internalContainerStyle, internalTextStyle] = useMemo(() => {
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
        textShadowColor:
          (isDarkMode || enableInLightMode) && !disabled ? opacity(color || inferredTextColor, shadowOpacity) : 'transparent',
        textShadowOffset: { width: x, height: y },
        textShadowRadius: blur,
      },
    ];
  }, [blur, color, disabled, enableInLightMode, inferredTextColor, isAnimatedText, isDarkMode, shadowOpacity, x, y]);

  return !IS_TEST && (IS_IOS || enableOnAndroid) ? (
    <>
      {isAnimatedText ? (
        // eslint-disable-next-line react/jsx-props-no-spreading
        <AnimatedText {...children.props} style={[children.props.style, internalTextStyle]} />
      ) : (
        <View style={[internalContainerStyle, containerStyle]}>
          <Text
            color={{ custom: 'transparent' }}
            numberOfLines={children.props.numberOfLines}
            size={children.props.size}
            style={[children.props.style, internalTextStyle]}
            weight={children.props.weight}
          >
            {children}
          </Text>
        </View>
      )}
    </>
  ) : (
    <>{children}</>
  );
};
