import React from 'react';
import { requireNativeComponent, StyleSheet, View } from 'react-native';

import { LoadingOverlay } from '@/components/modal/LoadingOverlay';
import { IS_IOS } from '@/env';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { sheetVerticalOffset } from '@/navigation/effects';
import Routes from '@/navigation/routesNames';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';

const NativePortal = IS_IOS ? requireNativeComponent('WindowPortal') : View;
const Wrapper = IS_IOS ? ({ children }: { children: React.ReactNode }) => children : View;

export function Portal() {
  const activeRoute = useActiveRoute();
  const loadingState = walletLoadingStore(state => state.loadingState);
  const shouldHide = !loadingState || (activeRoute === Routes.PIN_AUTHENTICATION_SCREEN && !IS_IOS);

  if (shouldHide) return null;

  return (
    <Wrapper
      pointerEvents="none"
      style={{
        ...StyleSheet.absoluteFillObject,
        pointerEvents: 'none',
      }}
    >
      <NativePortal {...(IS_IOS ? { blockTouches: true } : {})} pointerEvents="none" style={StyleSheet.absoluteFillObject}>
        <LoadingOverlay paddingTop={sheetVerticalOffset} title={loadingState} />
      </NativePortal>
    </Wrapper>
  );
}
