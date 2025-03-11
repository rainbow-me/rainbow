import { noop } from 'lodash';
import React, { createContext, useContext, useRef } from 'react';
import Animated, { SharedValue, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

export const ScrollPositionContext = createContext<{
  scrollViewRef: React.RefObject<Animated.ScrollView> | null;
  position: SharedValue<number>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
  updateContentSize: () => void;
}>({
  scrollViewRef: null,
  position: { value: 0 } as SharedValue<number>,
  scrollHandler: noop as ReturnType<typeof useAnimatedScrollHandler>,
  updateContentSize: noop,
});

export function ScrollPositionProvider({ children }: { children: React.ReactNode }) {
  const position = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      position.value = event.contentOffset.y;
    },
  });

  const updateContentSize = () => {
    'worklet';
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: position.value, animated: false });
    }
  };

  return (
    <ScrollPositionContext.Provider value={{ position, scrollHandler, scrollViewRef, updateContentSize }}>
      {children}
    </ScrollPositionContext.Provider>
  );
}

export function useScrollPosition() {
  return useContext(ScrollPositionContext);
}
