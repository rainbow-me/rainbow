// @ts-nocheck
import React, { type PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import ConditionalWrap from 'conditional-wrap';
import { LinearGradient } from 'expo-linear-gradient';

import { AccentColorProvider, Box, type Space } from '@/design-system';
import deviceUtils from '@/utils/deviceUtils';

import ButtonPressAnimation from '../animations/ButtonPressAnimation';

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
  onPress?: (any: any) => void;
  borderColor?: string;
  color?: string;
  ignoreShadow?: boolean;
  testID?: string;
  padding?: Space;
};

export const GenericCard = ({
  children,
  disabled = false,
  type,
  gradient = transparentGradient,
  onPress,
  borderColor,
  color,
  padding = '20px',
  ignoreShadow = false,
  testID,
}: PropsWithChildren<GenericCardProps>) => (
  <ConditionalWrap
    condition={!!onPress}
    wrap={(children: React.ReactNode) => (
      <ButtonPressAnimation onPress={onPress} testID={testID} disabled={disabled} scaleTo={0.96} overflowMargin={50} skipTopMargin>
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
        // @ts-ignore overloaded props
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
        borderRadius={24}
        {...(!ignoreShadow && {
          shadow: color ? '18px accent' : '18px',
        })}
        style={{
          flex: Platform.OS === 'ios' ? 0 : undefined,
          borderColor: borderColor ?? undefined,
          borderWidth: borderColor ? 1 : undefined,
        }}
        padding={padding}
        testID={!onPress ? testID : undefined}
      >
        {children}
      </Box>
    </ConditionalWrap>
  </ConditionalWrap>
);
