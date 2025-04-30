import React from 'react';
import { useRoute, RouteProp } from '@react-navigation/native';

import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { Box } from '@/design-system';
import { RootStackParamList } from '@/navigation/types';
import { StyleSheet } from 'react-native';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { Panel, TapToDismiss } from '@/components/SmoothPager/ListPanel';
import { useNavigation } from '@/navigation';

/**
 * The core Portal sheet
 */
export function Portal() {
  const { goBack } = useNavigation();
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.PORTAL>>();

  if (!params) {
    goBack();
    return null;
  }

  return (
    <Box style={styles.container}>
      <TapToDismiss />
      <Panel height={params.sheetHeight} innerBorderWidth={0} outerBorderWidth={0} style={styles.panel}>
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

  const open = React.useCallback((children: React.FC, options: Omit<RootStackParamList[typeof Routes.PORTAL], 'children'> = {}) => {
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
export function open(children: React.FC, options: Omit<RootStackParamList[typeof Routes.PORTAL], 'children'> = {}) {
  Navigation.handleAction(Routes.PORTAL, {
    children,
    ...options,
  });
}

export function close() {
  Navigation.goBack();
}
