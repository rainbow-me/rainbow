import { Box, Text } from '@/design-system';
import { CustomShadow } from '@/design-system/layout/shadow';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import LinearGradient from 'react-native-linear-gradient';
import { useDimensions } from '@/hooks';

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
  gradient: string[];
  children: React.ReactNode;
  onPress: () => void;
}

const GenericCard = ({
  children,
  type,
  gradient,
  onPress,
}: GenericCardProps) => {
  const { width } = useDimensions();

  return (
    <ButtonPressAnimation
      onPress={onPress}
      scaleTo={0.92}
      testID="learn-card-button"
    >
      <Box
        as={LinearGradient}
        background="body (Deprecated)"
        width={type === 'square' ? { custom: (width - 60) / 2 } : 'full'}
        height={type === 'square' ? { custom: (width - 60) / 2 } : undefined}
        borderRadius={24}
        shadow={CardShadow}
        colors={gradient}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
      >
        {children}
      </Box>
    </ButtonPressAnimation>
  );
};

export default GenericCard;
