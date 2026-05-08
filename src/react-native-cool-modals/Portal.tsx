import React from 'react';
import { Platform, requireNativeComponent, StyleSheet, View } from 'react-native';

import { LoadingOverlay } from '@/components/modal/LoadingOverlay';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { sheetVerticalOffset } from '@/navigation/effects';
import Routes from '@/navigation/routesNames';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';

const NativePortal = Platform.OS === 'ios' ? requireNativeComponent('WindowPortal') : View;
const Wrapper = Platform.OS === 'ios' ? ({ children }: { children: React.ReactNode }) => children : View;

export function Portal() {
  const activeRoute = useActiveRoute();
  const loadingState = walletLoadingStore(state => state.loadingState);
  const shouldHide = !loadingState || (activeRoute === Routes.PIN_AUTHENTICATION_SCREEN && Platform.OS !== 'ios');

  if (shouldHide) return null;

  return (
    <Wrapper
      pointerEvents="none"
      style={{
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'none',
      }}
    >
      <NativePortal {...(Platform.OS === 'ios' ? { blockTouches: true } : {})} pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <LoadingOverlay paddingTop={sheetVerticalOffset} title={loadingState} />
      </NativePortal>
    </Wrapper>
  );
}
