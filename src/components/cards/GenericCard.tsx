import { globalColors, Box, Text, AccentColorProvider } from '@/design-system';
import { CustomShadow } from '@/design-system/layout/shadow';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import LinearGradient from 'react-native-linear-gradient';
import { useDimensions } from '@/hooks';
import { BackgroundColor } from '@/design-system/color/palettes';
import ConditionalWrap from 'conditional-wrap';

const CardShadow: CustomShadow = {
  custom: {
    android: {
      color: { custom: globalColors.pink100 },
      elevation: 24,
      opacity: 0.5,
    },
    ios: [
      {
        blur: 24,
        color: { custom: globalColors.pink100 },
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
  onPress: () => void;
  height?: number;
  color?: 'accent' | BackgroundColor;
}

const GenericCard = ({
  children,
  type,
  gradient,
  onPress,
  height,
  color = 'surfacePrimaryElevated',
}: GenericCardProps) => {
  const { width } = useDimensions();

  return (
    <ButtonPressAnimation
      onPress={onPress}
      scaleTo={0.92}
      testID="learn-card-button"
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
          >
            {children}
          </Box>
        )}
      >
        <Box
          background={gradient ? undefined : color}
          width={type === 'square' ? { custom: (width - 60) / 2 } : 'full'}
          height={{
            custom: type === 'square' ? (width - 60) / 2 : height ?? 0,
          }}
          borderRadius={24}
          shadow={CardShadow}
        >
          {children}
        </Box>
      </ConditionalWrap>
    </ButtonPressAnimation>
  );
};

export default GenericCard;
