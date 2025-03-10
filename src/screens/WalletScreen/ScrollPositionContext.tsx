import React, { createContext, useContext, useRef } from 'react';
import Animated, { SharedValue, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

// Create a dummy handler that does nothing
const dummyHandler = () => {};

export const ScrollPositionContext = createContext<{
  scrollViewRef: React.RefObject<Animated.ScrollView> | null;
  position: SharedValue<number>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
}>({
  scrollViewRef: null,
  position: { value: 0 } as SharedValue<number>,
  scrollHandler: dummyHandler as ReturnType<typeof useAnimatedScrollHandler>,
});

export function ScrollPositionProvider({ children }: { children: React.ReactNode }) {
  const position = useSharedValue(0); // Initialize to 0, which is ScrollView's natural starting point
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      position.value = event.contentOffset.y;
    },
  });

  return <ScrollPositionContext.Provider value={{ position, scrollHandler, scrollViewRef }}>{children}</ScrollPositionContext.Provider>;
}

export function useScrollPosition() {
  return useContext(ScrollPositionContext);
}
