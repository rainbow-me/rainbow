import React, { createContext, useContext } from 'react';
import { SharedValue, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';

// Create a dummy handler that does nothing
const dummyHandler = () => {};

export const ScrollPositionContext = createContext<{
  position: SharedValue<number>;
  scrollHandler: ReturnType<typeof useAnimatedScrollHandler>;
}>({
  position: { value: 0 } as SharedValue<number>,
  scrollHandler: dummyHandler as ReturnType<typeof useAnimatedScrollHandler>,
});

export function ScrollPositionProvider({ children }: { children: React.ReactNode }) {
  const position = useSharedValue(0); // Initialize to 0, which is ScrollView's natural starting point

  // Simple scroll handler that directly uses ScrollView's natural behavior
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      position.value = event.contentOffset.y;
    },
  });

  return <ScrollPositionContext.Provider value={{ position, scrollHandler }}>{children}</ScrollPositionContext.Provider>;
}

export function useScrollPosition() {
  return useContext(ScrollPositionContext);
}
