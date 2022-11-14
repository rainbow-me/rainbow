import { Box, AccentColorProvider } from '@/design-system';
import React, { PropsWithChildren } from 'react';
import { ButtonPressAnimation } from '../animations';
import LinearGradient from 'react-native-linear-gradient';
import { globalColors } from '@/design-system/color/palettes';
import { deviceUtils } from '@/utils';
import ConditionalWrap from 'conditional-wrap';

// (device width - (horizontal inset * 2 + padding between cards)) / # of cards in row
export const SQUARE_CARD_SIZE = (deviceUtils.dimensions.width - 60) / 2;

export type CardType = 'square' | 'stretch';

type GenericCardProps = {
  type: CardType;
  gradient?: string[];
  disabled?: boolean;
  onPress?: () => void;
  color?: string;
  testID?: string;
};

export const GenericCard = ({
  children,
  disabled = false,
  type,
  gradient = ['transparent', 'transparent'],
  onPress,
  color,
  testID,
}: PropsWithChildren<GenericCardProps>) => (
  <ConditionalWrap
    condition={!!onPress}
    wrap={(children: React.ReactNode) => (
      <ButtonPressAnimation
        onPress={onPress}
        disabled={disabled}
        scaleTo={0.96}
        overflowMargin={50}
      >
        {children}
      </ButtonPressAnimation>
    )}
  >
    <AccentColorProvider color={color ?? globalColors.grey100}>
      <Box
        background={color ? 'accent' : 'surfacePrimaryElevated'}
        as={LinearGradient}
        colors={gradient}
        end={{ x: 1, y: 0 }}
        start={{ x: 0, y: 0.5 }}
        width={type === 'square' ? { custom: SQUARE_CARD_SIZE } : 'full'}
        height={
          type === 'square'
            ? {
                custom: SQUARE_CARD_SIZE,
              }
            : undefined
        }
        borderRadius={20}
        shadow={color ? '18px accent' : '18px'}
        padding="20px"
        testID={testID}
      >
        {children}
      </Box>
    </AccentColorProvider>
  </ConditionalWrap>
);
