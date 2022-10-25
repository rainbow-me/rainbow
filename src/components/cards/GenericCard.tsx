import { Box, AccentColorProvider } from '@/design-system';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import LinearGradient from 'react-native-linear-gradient';
import { globalColors } from '@/design-system/color/palettes';
import { deviceUtils } from '@/utils';
import ConditionalWrap from 'conditional-wrap';

// (device width - (horizontal inset * 2 + padding between cards)) / # of cards in row
export const SquareCardHeight = (deviceUtils.dimensions.width - 60) / 2;

interface GenericCardProps {
  type: 'square' | 'stretch';
  gradient?: string[];
  children: React.ReactNode;
  onPress?: () => void;
  color?: string;
}

export const GenericCard = ({
  children,
  type,
  gradient,
  onPress,
  color,
}: GenericCardProps) => (
  <ConditionalWrap
    condition={onPress}
    wrap={(children: React.ReactNode) => (
      <ButtonPressAnimation onPress={onPress}>{children}</ButtonPressAnimation>
    )}
  >
    <AccentColorProvider color={color ?? globalColors.grey100}>
      <Box
        background={color ? 'accent' : 'surfacePrimaryElevated'}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...(gradient && {
          as: LinearGradient,
          colors: gradient,
          end: { x: 1, y: 0.5 },
          start: { x: 0, y: 0.5 },
        })}
        width={type === 'square' ? { custom: SquareCardHeight } : 'full'}
        height={
          type === 'square'
            ? {
                custom: SquareCardHeight,
              }
            : undefined
        }
        borderRadius={24}
        // @ts-expect-error - Box will take flex prop it just doesn't want to
        flex={0}
        shadow={color ? '18px accent' : '18px'}
        padding="20px"
      >
        {children}
      </Box>
    </AccentColorProvider>
  </ConditionalWrap>
);
