import React from 'react';
import { IS_IOS } from '@/env';
import { portalStore } from '@/state/portal/portal';
import { requireNativeComponent, StyleSheet, View } from 'react-native';

const NativePortal = IS_IOS ? requireNativeComponent('WindowPortal') : View;
const Wrapper = IS_IOS ? ({ children }: { children: React.ReactNode }) => children : View;

export function Portal() {
  const { blockTouches, Component } = portalStore(state => ({
    blockTouches: state.blockTouches,
    Component: state.Component,
  }));

  if (!Component) {
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
