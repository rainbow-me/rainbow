import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Platform, requireNativeComponent, StyleSheet, View } from 'react-native';

const NativePortalContext = createContext();

export function usePortal() {
  return useContext(NativePortalContext);
}

const NativePortal = Platform.OS === 'ios' ? requireNativeComponent('WindowPortal') : View;

const Wrapper = Platform.OS === 'ios' ? ({ children }) => children : View;

export function Portal({ children }) {
  const [Component, setComponentState] = useState(null);
  const [blockTouches, setBlockTouches] = useState(false);

  const hide = useCallback(() => {
    setComponentState(<React.Fragment />);
    setBlockTouches(false);
  }, []);

  const setComponent = useCallback((value, blockTouches) => {
    setComponentState(value);
    setBlockTouches(blockTouches);
  }, []);

  const contextValue = useMemo(
    () => ({
      hide,
      setComponent,
    }),
    [hide, setComponent]
  );

  return (
    <NativePortalContext.Provider value={contextValue}>
      <Wrapper pointerEvents={blockTouches ? 'none' : 'auto'} style={[StyleSheet.absoluteFillObject]}>
        {children}
        <NativePortal
          blockTouches={blockTouches}
          pointerEvents={Platform.OS === 'ios' || !blockTouches ? 'none' : 'auto'}
          style={StyleSheet.absoluteFillObject}
        >
          {Component}
        </NativePortal>
      </Wrapper>
    </NativePortalContext.Provider>
  );
}
