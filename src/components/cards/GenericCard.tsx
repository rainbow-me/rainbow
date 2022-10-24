import { Box, AccentColorProvider } from '@/design-system';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import LinearGradient from 'react-native-linear-gradient';
import { BackgroundColor, globalColors } from '@/design-system/color/palettes';
import ConditionalWrap from 'conditional-wrap';
import { deviceUtils } from '@/utils';
import { View } from 'react-native';

// (device width - (horizontal inset * 2 + padding between cards)) / # of cards in row
export const SquareCardHeight = (deviceUtils.dimensions.width - 60) / 2;

interface GenericCardProps {
  type: 'square' | 'stretch';
  gradient?: string[];
  children: React.ReactNode;
  onPress?: () => void;
  color?: 'accent' | BackgroundColor;
  shadowColor?: string;
}

const GenericCard = ({
  children,
  type,
  gradient,
  onPress,
  color = 'surfacePrimaryElevated',
  shadowColor,
}: GenericCardProps) => {
  return (
    <ConditionalWrap
      condition={onPress}
      wrap={children => (
        <ButtonPressAnimation onPress={onPress} scaleTo={0.92}>
          {children}
        </ButtonPressAnimation>
      )}
    >
      {/* <ConditionalWrap
        condition={gradient}
        wrap={children => (
          <Box
            as={LinearGradient}
            colors={gradient}
            end={{ x: 1, y: 0.5 }}
            start={{ x: 0, y: 0.5 }}
            shadow="18px accent"
            borderRadius={24}
          >
            {children}
          </Box>
        )}
      > */}
      <AccentColorProvider color={shadowColor ?? globalColors.blue100}>
        <Box
          background={gradient ? undefined : color}
          as={gradient ? LinearGradient : View}
          colors={gradient}
          end={gradient ? { x: 1, y: 0.5 } : undefined}
          start={gradient ? { x: 0, y: 0.5 } : undefined}
          width={type === 'square' ? { custom: SquareCardHeight } : 'full'}
          height={
            type === 'square'
              ? {
                  custom: SquareCardHeight,
                }
              : undefined
          }
          borderRadius={24}
          flex={0}
          shadow="18px accent"
          padding="20px"
        >
          {children}
        </Box>
      </AccentColorProvider>
      {/* </ConditionalWrap> */}
    </ConditionalWrap>
  );
};

export default GenericCard;
