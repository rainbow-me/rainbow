import React from 'react';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';

import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { Box } from '@/design-system';
import { StyleSheet } from 'react-native';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { Panel, TapToDismiss } from '@/components/SmoothPager/ListPanel';

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
    <Box style={styles.container}>
      <TapToDismiss />
      <Panel height={params.sheetHeight} innerBorderWidth={0} outerBorderWidth={2.5} style={styles.panel}>
        {params.children({})}
      </Panel>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flex: 1,
    height: DEVICE_HEIGHT,
    justifyContent: 'flex-end',
    pointerEvents: 'box-none',
  },
  panel: {
    justifyContent: 'space-between',
    width: DEVICE_WIDTH,
  },
});

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
