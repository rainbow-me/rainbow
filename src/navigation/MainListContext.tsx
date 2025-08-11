import { LegendListRef } from '@legendapp/list';
import React, { createContext, RefObject, useEffect, useMemo, useRef } from 'react';

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

export const useLegendListNavBarScrollToTop = (listRef: RefObject<LegendListRef | null>) => {
  const { setScrollToTopRef } = useMainList() || {};

  const scrollToTopRef = useMemo(() => {
    return {
      scrollToTop() {
        if (!listRef.current) {
          return;
        }
        if (listRef.current.getState().isAtStart) {
          return;
        }
        listRef.current.scrollToIndex({
          index: 0,
          // for some reason legend list wasnt scrolling all the way to the top by ~50px
          // this just forces it, adding extra padding just in case:
          viewOffset: 200,
          animated: true,
        });
      },
    };
  }, [listRef]);

  useEffect(() => {
    setScrollToTopRef?.(scrollToTopRef);
  }, [scrollToTopRef, setScrollToTopRef]);
};
