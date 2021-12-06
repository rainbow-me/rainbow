import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Platform,
  requireNativeComponent,
  StyleSheet,
  View,
} from 'react-native';

// @ts-expect-error ts-migrate(2554) FIXME: Expected 1 arguments, but got 0.
const NativePortalContext = createContext();

export function usePortal() {
  return useContext(NativePortalContext);
}

const NativePortal =
  Platform.OS === 'ios' ? requireNativeComponent('WindowPortal') : View;

const Wrapper = Platform.OS === 'ios' ? ({ children }: any) => children : View;

export function Portal({ children }: any) {
  const [Component, setComponentState] = useState(null);
  const [blockTouches, setBlockTouches] = useState(false);

  const hide = useCallback(() => {
    // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'Element' is not assignable to pa... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <NativePortalContext.Provider value={contextValue}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Wrapper
        pointerEvents={blockTouches ? 'none' : 'auto'}
        style={[StyleSheet.absoluteFillObject]}
      >
        {children}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <NativePortal
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
          blockTouches={blockTouches}
          pointerEvents={
            Platform.OS === 'ios' || !blockTouches ? 'none' : 'auto'
          }
          style={StyleSheet.absoluteFillObject}
        >
          {Component}
        </NativePortal>
      </Wrapper>
    </NativePortalContext.Provider>
  );
}
