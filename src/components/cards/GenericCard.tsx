import { Box, AccentColorProvider, useForegroundColor } from '@/design-system';
import { CustomShadow } from '@/design-system/layout/shadow';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import LinearGradient from 'react-native-linear-gradient';
import { BackgroundColor, globalColors } from '@/design-system/color/palettes';
import ConditionalWrap from 'conditional-wrap';
import { useTheme } from '@/theme';
import { deviceUtils } from '@/utils';

export const SquareCardHeight = (deviceUtils.dimensions.width - 60) / 2;

const CardShadow: CustomShadow = {
  custom: {
    android: {
      color: 'accent',
      elevation: 24,
      opacity: 0.5,
    },
    ios: [
      {
        blur: 24,
        color: 'accent',
        offset: { x: 0, y: 8 },
        opacity: 0.35,
      },
    ],
  },
};

interface GenericCardProps {
  type: 'square' | 'stretch';
  gradient?: string[];
  children: React.ReactNode;
  onPress?: () => void;
  height?: number;
  color?: 'accent' | BackgroundColor;
  shadowColor?: string;
}

const GenericCard = ({
  children,
  type,
  gradient,
  onPress,
  height,
  color = 'surfacePrimaryElevated',
  shadowColor,
}: GenericCardProps) => {
  const { isDarkMode } = useTheme();
  const themedShadowColor =
    !isDarkMode && shadowColor ? { custom: shadowColor } : undefined;

  return (
    <ConditionalWrap
      condition={onPress}
      wrap={children => (
        <ButtonPressAnimation onPress={onPress} scaleTo={0.92}>
          {children}
        </ButtonPressAnimation>
      )}
    >
      <ConditionalWrap
        condition={gradient}
        wrap={children => (
          <Box
            as={LinearGradient}
            borderRadius={24}
            colors={gradient}
            end={{ x: 1, y: 0.5 }}
            start={{ x: 0, y: 0.5 }}
            shadow={CardShadow}
          >
            {children}
          </Box>
        )}
      >
        <Box
          background={gradient ? undefined : color}
          width={type === 'square' ? { custom: SquareCardHeight } : 'full'}
          height={{
            custom: type === 'square' ? SquareCardHeight : height ?? 0,
          }}
          borderRadius={24}
          shadow={{
            custom: {
              android: {
                color: themedShadowColor,
                elevation: 24,
                opacity: 0.5,
              },
              ios: [
                {
                  blur: 24,
                  color: themedShadowColor,
                  offset: { x: 0, y: 8 },
                  opacity: 0.35,
                },
              ],
            },
          }}
          padding="20px"
        >
          {children}
        </Box>
      </ConditionalWrap>
    </ConditionalWrap>
  );
};

export default GenericCard;
