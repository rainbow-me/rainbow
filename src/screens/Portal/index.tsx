import React from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';

import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { Box } from '@/design-system';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';

export type PortalSheetProps = {
  sheetHeight?: number;
  children: React.FC;
};

type NavigationRouteParams = {
  Portal: PortalSheetProps;
};

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
      <Box paddingVertical="44px" paddingHorizontal="32px" height="full" background="surfaceSecondary">
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
 *    `const { open } = p.useOpen()`
 *    `open(() => <p.Title>...</p.Title>, { ...options })`
 */
export function useOpen() {
  const { navigate } = useNavigation();

  const open = React.useCallback((children: React.FC, options: Omit<PortalSheetProps, 'children'> = {}) => {
    navigate(Routes.PORTAL, {
      children,
      ...options,
    });
  }, []);

  return {
    open,
  };
}

/**
 * Use `useOpen` where possible. This util exists for limited use
 * outside a React component.
 */
export function open(children: React.FC, options: Omit<PortalSheetProps, 'children'> = {}) {
  Navigation.handleAction(Routes.PORTAL, {
    children,
    ...options,
  });
}

export function close() {
  Navigation.goBack();
}
