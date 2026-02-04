import React, { useMemo } from 'react';
import { IS_IOS } from '@/env';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';
import { requireNativeComponent, StyleSheet, View } from 'react-native';
import Routes from '@/navigation/routesNames';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import { LoadingOverlay } from '@/components/modal';
import { sheetVerticalOffset } from '@/navigation/effects';

const NativePortal = IS_IOS ? requireNativeComponent('WindowPortal') : View;
const Wrapper = IS_IOS ? ({ children }: { children: React.ReactNode }) => children : View;

export function Portal() {
  const activeRoute = useActiveRoute();
  const loadingState = walletLoadingStore(state => state.loadingState);

  const shouldHide = useMemo(() => {
    return !loadingState || (activeRoute === Routes.PIN_AUTHENTICATION_SCREEN && !IS_IOS);
  }, [loadingState, activeRoute]);

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
