import React from 'react';

import {
  Box,
  Text,
  TextProps,
  AccentColorProvider,
  Stack,
} from '@/design-system';
import { ImgixImage } from '@/components/images';
import SheetActionButton from '@/components/sheet/sheet-action-buttons/SheetActionButton';
import { ImageSourcePropType } from 'react-native';

export { open, useOpen } from '@/screens/Portal';

/**
 * Proxy for `SheetActionButton` with no changes to API.
 *
 * TODO This is proxied because eventually I'd like to replace this.
 */
export const Button = SheetActionButton;

/**
 * Image icon component for use within the Portal sheet.
 *
 *   `import * as p from '@/screens/Portal';`
 *
 *   `<p.Logo accentColor={...} source={require('...')} />`
 */
export function Logo({
  accentColor,
  source,
  size = 64,
}: {
  accentColor: string;
  source: ImageSourcePropType;
  size?: number;
}) {
  return (
    <Box
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      paddingBottom="20px"
    >
      <AccentColorProvider color={accentColor}>
        {/* @ts-expect-error Box doesn't like ImgixImage */}
        <Box
          as={ImgixImage}
          source={source}
          size={size}
          width={{ custom: size }}
          height={{ custom: size }}
          shadow="18px accent"
        />
      </AccentColorProvider>
    </Box>
  );
}

/**
 * Emoji "logo" for use within the Portal sheet.
 */
export function Emoji({ children }: { children: string }) {
  return (
    <Box paddingBottom="20px">
      <Text
        containsEmoji
        color="accent"
        align="center"
        size="44pt"
        weight="bold"
      >
        {children}
      </Text>
    </Box>
  );
}

/**
 * Title text for use within the Portal sheet.
 */
export function Title({
  children,
  color,
  size,
  weight,
  ...props
}: Omit<Partial<TextProps>, 'children'> & { children: string }) {
  return (
    <Box paddingBottom="36px">
      <Text
        color={color || 'label'}
        weight={weight || 'heavy'}
        size={size || '26pt'}
        align="center"
        {...props}
      >
        {children}
      </Text>
    </Box>
  );
}

/**
 * Body text for use within the Portal sheet.
 */
export function Body({
  children,
  size,
  color,
  ...props
}: Omit<Partial<TextProps>, 'children'> & { children: string }) {
  return (
    <Box paddingBottom="20px">
      <Text
        color={color || 'labelSecondary'}
        size={size || '17pt / 135%'}
        align="center"
        {...props}
      >
        {children}
      </Text>
    </Box>
  );
}

/**
 * A wrapper for any buttons you might want to add to the Portal sheet.
 * Multiple buttons are automatically spaced apart.
 *
 * TODO eventually this should be sticky to the bottom of the sheet to match
 * designs.
 */
export function Footer({
  children,
}: {
  children: React.ReactNode | React.ReactNodeArray;
}) {
  return (
    <Box paddingTop="12px">
      <Stack space="16px">{children}</Stack>
    </Box>
  );
}
