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
  shadowColor?: ForegroundColor;
}

const GenericCard = ({
  children,
  type,
  gradient,
  onPress,
  height,
  color = 'surfacePrimaryElevated',
  shadowColor = 'shadow',
}: GenericCardProps) => {
  const { width } = useDimensions();
  const shadowColorString = useForegroundColor(shadowColor);

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
        <AccentColorProvider color={shadowColorString}>
          <Box
            background={gradient ? undefined : color}
            width={type === 'square' ? { custom: (width - 60) / 2 } : 'full'}
            height={{
              custom: type === 'square' ? (width - 60) / 2 : height ?? 0,
            }}
            borderRadius={24}
            shadow={CardShadow}
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
