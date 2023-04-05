import React from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';

import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import {
  Box,
  Text,
  TextProps,
  AccentColorProvider,
  Stack,
} from '@/design-system';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { ImgixImage } from '@/components/images';
import SheetActionButton from '@/components/sheet/sheet-action-buttons/SheetActionButton';

type PortalSheetProps = {
  sheetHeight?: number;
  children: React.FC;
};

type NavigationRouteParams = {
  Portal: PortalSheetProps;
};

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
  source: StaticImageData;
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

/**
 * The core Portal sheet
 */
export function Portal() {
  const { goBack } = useNavigation();
  const { params } = useRoute<RouteProp<NavigationRouteParams, 'Portal'>>();

  if (!params) {
    goBack();
    return null;
  }

  return (
    <SimpleSheet backgroundColor="white" scrollEnabled={false}>
      <Box
        paddingVertical="44px"
        paddingHorizontal="32px"
        height="full"
        background="surfaceSecondary"
      >
        {params.children({})}
      </Box>
    </SimpleSheet>
  );
}

/**
 * Returns a util used to navigate to and render components within the Portal
 * sheet. This file also exports components that should be used for the sheet's
 * children.
 *
 *    `import * as p from '@/screens/Portal';`
 *
 *    `const { open } = p.usePortalSheet()`
 *    `open(() => <p.Title>...</p.Title>, { ...options })`
 */
export function usePortalSheet() {
  const { navigate } = useNavigation();

  const open = React.useCallback(
    (children: React.FC, options: Omit<PortalSheetProps, 'children'> = {}) => {
      navigate(Routes.PORTAL, {
        children,
        ...options,
      });
    },
    []
  );

  return {
    open,
  };
}

/**
 * Use `usePortalSheet` where possible. This util exists for limited use
 * outside a React component.
 */
export function openPortalSheet(
  children: React.FC,
  options: Omit<PortalSheetProps, 'children'> = {}
) {
  Navigation.handleAction(Routes.PORTAL, {
    children,
    ...options,
  });
}
