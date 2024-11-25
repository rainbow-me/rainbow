import React, { useEffect, useState } from 'react';
import { IS_ANDROID, IS_IOS } from '@/env';
import { portalStore } from '@/state/portal/portal';
import { requireNativeComponent, StyleSheet, View } from 'react-native';
import Routes from '@/navigation/routesNames';
import { Navigation, useNavigation } from '@/navigation';
import { useActiveRoute } from '@/hooks/useActiveRoute';

const NativePortal = IS_IOS ? requireNativeComponent('WindowPortal') : View;
const Wrapper = IS_IOS ? ({ children }: { children: React.ReactNode }) => children : View;

export function Portal() {
  const activeRoute = useActiveRoute();

  const { blockTouches, Component } = portalStore(state => ({
    blockTouches: state.blockTouches,
    Component: state.Component,
  }));

  if (!Component || (activeRoute === Routes.PIN_AUTHENTICATION_SCREEN && !IS_IOS)) {
    return null;
  }

  return (
    <Wrapper
      pointerEvents={blockTouches ? 'none' : 'auto'}
      style={[
        sx.wrapper,
        {
          pointerEvents: blockTouches ? 'none' : 'auto',
        },
      ]}
    >
      <NativePortal
        {...(IS_IOS ? { blockTouches } : {})}
        pointerEvents={IS_IOS || !blockTouches ? 'none' : 'auto'}
        style={StyleSheet.absoluteFillObject}
      >
        {Component}
      </NativePortal>
    </Wrapper>
  );
}

const sx = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
  },
});
