import React, { ReactElement, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { IS_ANDROID, IS_TEST } from '@/env';
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

function isAnimatedTextChild(child: ReactElement<TextProps | AnimatedTextProps>): child is ReactElement<AnimatedTextProps> {
  return child.type === AnimatedText;
}

export const TextShadow = ({
  blur = 16,
  children,
  color,
  containerStyle,
  disabled = false,
  enableInLightMode = false,
  enableOnAndroid = false,
  shadowOpacity = 0.6,
  x = 0,
  y = 0,
}: TextShadowProps) => {
  const { isDarkMode } = useColorMode();
  const inferredTextColor = useForegroundColor(children.props.color ?? 'label');
  const isAnimatedText = isAnimatedTextChild(children);

  const { internalContainerStyle, internalPositionStyle, internalShadowStyle } = useMemo(
    () =>
      generateTextShadowStyles({
        blur,
        color,
        disabled,
        enableInLightMode,
        inferredTextColor,
        isAnimatedText,
        isDarkMode,
        shadowOpacity,
        x,
        y,
      }),
    [blur, color, disabled, enableInLightMode, inferredTextColor, isAnimatedText, isDarkMode, shadowOpacity, x, y]
  );

  if (IS_TEST || (IS_ANDROID && !enableOnAndroid)) return children;

  return isAnimatedText ? (
    // eslint-disable-next-line react/jsx-props-no-spreading
    <AnimatedText {...children.props} style={[internalShadowStyle, children.props.style, internalPositionStyle]} />
  ) : (
    <View style={[containerStyle, internalContainerStyle]}>
      <Text
        numberOfLines={children.props.numberOfLines}
        color={{ custom: 'transparent' }}
        size={children.props.size}
        style={[internalShadowStyle, children.props.style, internalPositionStyle]}
        weight={children.props.weight}
      >
        {children}
      </Text>
    </View>
  );
};

interface GenerateTextShadowStylesParams {
  blur: number;
  color?: string;
  disabled?: boolean;
  enableInLightMode?: boolean;
  inferredTextColor: string;
  isAnimatedText: boolean;
  isDarkMode: boolean;
  shadowOpacity: number;
  x: number;
  y: number;
}

const generateTextShadowStyles = ({
  blur,
  color,
  disabled,
  enableInLightMode,
  inferredTextColor,
  isAnimatedText,
  isDarkMode,
  shadowOpacity,
  x,
  y,
}: GenerateTextShadowStylesParams) => {
  const extraSpaceForShadow = blur + Math.max(Math.abs(x), Math.abs(y));
  return {
    internalContainerStyle: {
      marginBottom: -extraSpaceForShadow,
      marginLeft: -extraSpaceForShadow,
      marginRight: -extraSpaceForShadow,
      marginTop: -extraSpaceForShadow,
    },
    internalPositionStyle: {
      ...(isAnimatedText
        ? {
            marginBottom: -extraSpaceForShadow,
            marginLeft: -extraSpaceForShadow,
            marginRight: -extraSpaceForShadow,
            marginTop: -extraSpaceForShadow,
          }
        : {}),
      paddingBottom: extraSpaceForShadow,
      paddingLeft: extraSpaceForShadow,
      paddingRight: extraSpaceForShadow,
      paddingTop: extraSpaceForShadow,
    },
    internalShadowStyle: {
      textShadowColor: (isDarkMode || enableInLightMode) && !disabled ? opacity(color || inferredTextColor, shadowOpacity) : 'transparent',
      textShadowOffset: { height: y, width: x },
      textShadowRadius: blur,
    },
  };
};
