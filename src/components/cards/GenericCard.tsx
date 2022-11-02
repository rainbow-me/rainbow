import { Box, AccentColorProvider } from '@/design-system';
import React from 'react';
import { ButtonPressAnimation } from '../animations';
import LinearGradient from 'react-native-linear-gradient';
import { globalColors } from '@/design-system/color/palettes';
import { deviceUtils } from '@/utils';
import { IS_IOS } from '@/env';
import ConditionalWrap from 'conditional-wrap';

// (device width - (horizontal inset * 2 + padding between cards)) / # of cards in row
export const SQUARE_CARD_HEIGHT = (deviceUtils.dimensions.width - 60) / 2;

type CardType = 'square' | 'stretch';

interface GenericCardProps {
  type: CardType;
  gradient?: string[];
  children: React.ReactNode;
  onPress?: () => void;
  color?: string;
  testID?: string;
}

export const GenericCard = ({
  children,
  type,
  gradient = ['transparent', 'transparent'],
  onPress,
  color,
  testID,
}: GenericCardProps) => (
  <ConditionalWrap
    condition={!!onPress}
    wrap={(children: React.ReactNode) => (
      <ButtonPressAnimation
        onPress={onPress}
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
        width={type === 'square' ? { custom: SQUARE_CARD_HEIGHT } : 'full'}
        height={
          type === 'square'
            ? {
                custom: SQUARE_CARD_HEIGHT,
              }
            : undefined
        }
        borderRadius={20}
        style={{ flex: IS_IOS ? 0 : undefined }}
        shadow={color ? '18px accent' : '18px'}
        padding="20px"
        testID={testID}
      >
        {children}
      </Box>
    </AccentColorProvider>
  </ConditionalWrap>
);
