import { createContext, useContext, useMemo, useRef, type ReactNode, type RefObject } from 'react';

import { type ScrollView } from 'react-native-gesture-handler';
import type Animated from 'react-native-reanimated';

import { type SportsBrowseHandle } from '@/features/sports/ui/SportsBrowse';

type PolymarketContextType = {
  accountScrollRef: RefObject<Animated.ScrollView | null>;
  categorySelectorRef: RefObject<ScrollView | null>;
  eventsListRef: RefObject<Animated.FlatList<unknown> | null>;
  sportsBrowseRef: RefObject<SportsBrowseHandle | null>;
  scrollBrowseToTop: () => void;
};

const PolymarketContext = createContext<PolymarketContextType | null>(null);

export function PolymarketProvider({ children }: { children: ReactNode }) {
  const accountScrollRef = useRef<Animated.ScrollView>(null);
  const categorySelectorRef = useRef<ScrollView>(null);
  const eventsListRef = useRef<Animated.FlatList<unknown>>(null);
  const sportsBrowseRef = useRef<SportsBrowseHandle>(null);

  const value = useMemo(
    () => ({
      accountScrollRef,
      categorySelectorRef,
      eventsListRef,
      sportsBrowseRef,
      scrollBrowseToTop: () => {
        sportsBrowseRef.current?.scrollToTop();
        eventsListRef.current?.scrollToOffset({ offset: 0, animated: true });
      },
    }),
    []
  );

  return <PolymarketContext.Provider value={value}>{children}</PolymarketContext.Provider>;
}

export function usePolymarketContext(): PolymarketContextType {
  const context = useContext(PolymarketContext);
  if (!context) {
    throw new Error('usePolymarketContext must be used within PolymarketProvider');
  }
  return context;
}
