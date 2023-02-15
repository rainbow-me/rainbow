import { Box, AccentColorProvider } from '@/design-system';
import React, { PropsWithChildren } from 'react';
import { ButtonPressAnimation } from '../animations';
import LinearGradient from 'react-native-linear-gradient';
import { globalColors } from '@/design-system/color/palettes';
import { deviceUtils } from '@/utils';
import ConditionalWrap from 'conditional-wrap';
import { IS_IOS } from '@/env';

// (device width - (horizontal inset * 2 + padding between cards)) / # of cards in row
export const SQUARE_CARD_SIZE = (deviceUtils.dimensions.width - 60) / 2;

export type CardType = 'square' | 'stretch';

export type Gradient = {
  colors: string[];
  start: { x: number; y: number };
  end: { x: number; y: number };
};

const transparentGradient = {
  colors: ['transparent', 'transparent'],
  start: { x: 0, y: 0 },
  end: { x: 0, y: 0 },
};

type GenericCardProps = {
  type: CardType;
  gradient?: Gradient;
  disabled?: boolean;
  onPress?: () => void;
  color?: string;
  testID?: string;
};

export const GenericCard = ({
  children,
  disabled = false,
  type,
  gradient = transparentGradient,
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
        skipTopMargin
      >
        {children}
      </ButtonPressAnimation>
    )}
  >
    <ConditionalWrap
      condition={color !== undefined && color !== 'accent'}
      wrap={(children: React.ReactNode) => (
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        <AccentColorProvider color={color!}>{children}</AccentColorProvider>
      )}
    >
      <Box
        background={color ? 'accent' : 'surfacePrimaryElevated'}
        as={LinearGradient}
        colors={gradient.colors}
        end={gradient.end}
        start={gradient.start}
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
        style={{ flex: IS_IOS ? 0 : undefined }}
        padding="20px"
        testID={testID}
      >
        {children}
      </Box>
    </ConditionalWrap>
  </ConditionalWrap>
);
