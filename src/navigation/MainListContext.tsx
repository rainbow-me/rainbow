import React, { createContext, useMemo, useRef } from 'react';

type ListScrollToTopRef = {
  scrollToTop: () => void;
};

export type MainListContext =
  | null
  | (ListScrollToTopRef & {
      setScrollToTopRef: (ref: ListScrollToTopRef) => void;
    });

export const MainListContext = createContext<MainListContext>(null);

export function MainListProvider({ children }: { children: React.ReactNode }) {
  const scrollToTopRef = useRef<ListScrollToTopRef | null>(null);

  const context: MainListContext = useMemo(() => {
    return {
      scrollToTop() {
        scrollToTopRef.current?.scrollToTop();
      },
      setScrollToTopRef: ref => {
        scrollToTopRef.current = ref;
      },
    };
  }, [scrollToTopRef]);

  return <MainListContext.Provider value={context}>{children}</MainListContext.Provider>;
}

export function useMainList() {
  return React.useContext(MainListContext);
}
