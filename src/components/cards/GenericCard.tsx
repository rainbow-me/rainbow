import {
  globalColors,
  Box,
  Text,
  AccentColorProvider,
  useForegroundColor,
} from '@/design-system';
import { CustomShadow } from '@/design-system/layout/shadow';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import LinearGradient from 'react-native-linear-gradient';
import { useDimensions } from '@/hooks';
import {
  BackgroundColor,
  ForegroundColor,
} from '@/design-system/color/palettes';
import ConditionalWrap from 'conditional-wrap';
import { useTheme } from '@/theme';

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
  color?: 'accent' | BackgroundColor;
  shadowColor?: string;
  rowLength?: number;
}

const GenericCard = ({
  children,
  type,
  gradient,
  onPress,
  color = 'surfacePrimaryElevated',
  shadowColor,
  rowLength,
}: GenericCardProps) => {
  const { width } = useDimensions();
  const { isDarkMode } = useTheme();
  const shadow = useForegroundColor('shadow');

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
        <AccentColorProvider color={shadowColor ?? shadow}>
          <Box
            background={gradient ? undefined : color}
            width={type === 'square' ? { custom: (width - 60) / 2 } : 'full'}
            height={
              type === 'square' ? { custom: (width - 60) / 2 } : undefined
            }
            borderRadius={24}
            // shadow={{
            //   custom: {
            //     android: {
            //       color: isDarkMode ? 'shadow' : 'accent',
            //       elevation: 24,
            //       opacity: 0.5,
            //     },
            //     ios: [
            //       {
            //         blur: 24,
            //         color: isDarkMode ? 'shadow' : 'accent',
            //         offset: { x: 0, y: 8 },
            //         opacity: 0.35,
            //       },
            //     ],
            //   },
            // }}
            padding="20px"
          >
            {children}
          </Box>
        </AccentColorProvider>
      </ConditionalWrap>
    </ConditionalWrap>
  );
};

export default GenericCard;
