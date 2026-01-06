import { createContext, ReactNode, RefObject, useContext, useMemo, useRef } from 'react';
import { ScrollView } from 'react-native';
import Animated from 'react-native-reanimated';

type PolymarketContextType = {
  accountScrollRef: RefObject<Animated.ScrollView | null>;
  categorySelectorRef: RefObject<ScrollView | null>;
  leagueSelectorRef: RefObject<ScrollView | null>;
  eventsListRef: RefObject<Animated.FlatList<any> | null>;
};

const PolymarketContext = createContext<PolymarketContextType | null>(null);

export function PolymarketProvider({ children }: { children: ReactNode }) {
  const accountScrollRef = useRef<Animated.ScrollView>(null);
  const categorySelectorRef = useRef<ScrollView>(null);
  const leagueSelectorRef = useRef<ScrollView>(null);
  const eventsListRef = useRef<Animated.FlatList<any>>(null);

  const value = useMemo(() => ({ accountScrollRef, categorySelectorRef, leagueSelectorRef, eventsListRef }), []);

  return <PolymarketContext.Provider value={value}>{children}</PolymarketContext.Provider>;
}

export function usePolymarketContext(): PolymarketContextType {
  const context = useContext(PolymarketContext);
  if (!context) {
    throw new Error('usePolymarketContext must be used within PolymarketProvider');
  }
  return context;
}
