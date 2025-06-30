import React, { createContext, useMemo, useState } from 'react';

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
  const [scrollToTopRef, setScrollToTopRef] = useState<ListScrollToTopRef | null>(null);

  const context: MainListContext = useMemo(() => {
    if (!scrollToTopRef) {
      return null;
    }

    return {
      ...scrollToTopRef,
      setScrollToTopRef: ref => setScrollToTopRef(ref),
    };
  }, [scrollToTopRef]);

  return <MainListContext.Provider value={context}>{children}</MainListContext.Provider>;
}

export function useMainList() {
  return React.useContext(MainListContext);
}
