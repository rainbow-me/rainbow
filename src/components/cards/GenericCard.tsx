import { Box, Text } from '@/design-system';
import { CustomShadow } from '@/design-system/layout/shadow';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import LinearGradient from 'react-native-linear-gradient';

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
  size: 'small' | 'medium' | 'large';
}

const GenericCard = ({ size }: GenericCardProps) => {
  return (
    <ButtonPressAnimation
      onPress={() => {}}
      scaleTo={0.92}
      testID="learn-card-button"
    >
      <Box
        as={LinearGradient}
        background="body (Deprecated)"
        width="full"
        height={{ custom: 165 }}
        borderRadius={24}
        shadow={CardShadow}
        colors={['#6D58F5', '#A970FF']}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
      >
        <Text size="13pt">hi</Text>
      </Box>
    </ButtonPressAnimation>
  );
};

export default GenericCard;
