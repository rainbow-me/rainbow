import { createContext, useContext, useMemo, useRef, type ReactNode, type RefObject } from 'react';

import { type ScrollView } from 'react-native-gesture-handler';
import type Animated from 'react-native-reanimated';

import { type SportsGamesListHandle } from '@/features/sports/ui/SportsGamesList';

type PolymarketContextType = {
  accountScrollRef: RefObject<Animated.ScrollView | null>;
  categorySelectorRef: RefObject<ScrollView | null>;
  eventsListRef: RefObject<Animated.FlatList<unknown> | null>;
  sportsGamesListRef: RefObject<SportsGamesListHandle | null>;
  scrollBrowseToTop: () => void;
};

const PolymarketContext = createContext<PolymarketContextType | null>(null);

export function PolymarketProvider({ children }: { children: ReactNode }) {
  const accountScrollRef = useRef<Animated.ScrollView>(null);
  const categorySelectorRef = useRef<ScrollView>(null);
  const eventsListRef = useRef<Animated.FlatList<unknown>>(null);
  const sportsGamesListRef = useRef<SportsGamesListHandle>(null);

  const value = useMemo(
    () => ({
      accountScrollRef,
      categorySelectorRef,
      eventsListRef,
      sportsGamesListRef,
      scrollBrowseToTop: () => {
        sportsGamesListRef.current?.scrollToTop();
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
