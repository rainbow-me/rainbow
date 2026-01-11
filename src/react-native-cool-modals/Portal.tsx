import React from 'react';
import { IS_IOS } from '@/env';
import { walletLoadingStore } from '@/state/walletLoading/walletLoading';
import { StyleSheet, View } from 'react-native';
import Routes from '@/navigation/routesNames';
import { useActiveRoute } from '@/hooks/useActiveRoute';
import NativeWindowPortal from './specs/NativeWindowPortal';

const NativePortal = IS_IOS ? NativeWindowPortal : View;
const Wrapper = IS_IOS ? ({ children }: { children: React.ReactNode }) => children : View;

export function Portal() {
  const activeRoute = useActiveRoute();
  const blockTouches = walletLoadingStore(state => state.blockTouches);
  const Component = walletLoadingStore(state => state.Component);

  if (!Component || (activeRoute === Routes.PIN_AUTHENTICATION_SCREEN && !IS_IOS)) {
    return null;
  }

  return (
    <Wrapper
      pointerEvents={blockTouches ? 'none' : 'auto'}
      style={{
        ...StyleSheet.absoluteFillObject,
        pointerEvents: blockTouches ? 'none' : 'auto',
      }}
    >
      <NativePortal
        {...(IS_IOS ? { blockTouches } : {})}
        pointerEvents={IS_IOS || blockTouches ? 'none' : 'auto'}
        style={StyleSheet.absoluteFillObject}
      >
        {Component}
      </NativePortal>
    </Wrapper>
  );
}
