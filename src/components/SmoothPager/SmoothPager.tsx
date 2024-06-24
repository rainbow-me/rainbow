import React, { ForwardedRef, forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  interpolate,
  runOnUI,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { clamp } from '@/__swaps__/utils/swaps';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box } from '@/design-system';
import { AlignVertical, alignVerticalToFlexAlign } from '@/design-system/layout/alignment';
import { deviceUtils } from '@/utils';

const DEVICE_WIDTH = deviceUtils.dimensions.width;
const PAGE_ANIMATION_CONFIG = TIMING_CONFIGS.slowerFadeConfig;

type PageId = string;
type ActiveSubPageIds = Record<number, string | null>;

interface PageProps {
  id: PageId;
  component: React.ReactElement;
}
const PagerPage: React.FC<PageProps> = ({ component }) => {
  return <>{component}</>;
};

interface GroupProps {
  children: React.ReactElement<PageProps>[];
}
const PagerGroup: React.FC<GroupProps> = ({ children }) => {
  return <>{children}</>;
};

interface SmoothPagerRef {
  goBack: () => void;
  goToPage: (id: PageId) => void;
}

export function usePagerNavigation() {
  const ref = useRef<SmoothPagerRef>(null);

  const goBack = useCallback(() => {
    ref.current?.goBack();
  }, []);
  const goToPage = useCallback((id: PageId) => {
    ref.current?.goToPage(id);
  }, []);

  return { goBack, goToPage, ref };
}

// This is used to initialize the shared value that keeps track of the active subpage ID for each page group
const initializeActiveSubPageIds = (pageIdToIndex: Record<PageId, number>, initialPage?: PageId): ActiveSubPageIds => {
  const pageIndices = Object.values(pageIdToIndex);
  const maxPageIndex = Math.max(...pageIndices);
  // Initialize the active subpage IDs array with null starting values for each page index
  const initialSubPageIds: (string | null)[] = new Array(maxPageIndex + 1).fill(null);
  const pageIndexCounts: Record<number, number> = {};
  Object.values(pageIdToIndex).forEach(index => {
    pageIndexCounts[index] = (pageIndexCounts[index] || 0) + 1;
  });

  // If a page group exists at a given index, set the active subpage ID to an empty string
  Object.entries(pageIndexCounts).forEach(([index, count]) => {
    if (count > 1) {
      initialSubPageIds[Number(index)] = '';
    }
  });

  // If the initial page ID matches a subpage, make that subpage active within the page group
  if (initialPage && pageIdToIndex[initialPage] !== undefined && initialSubPageIds[pageIdToIndex[initialPage]] === '') {
    initialSubPageIds[pageIdToIndex[initialPage]] = initialPage;
  }

  // Any top-level Page components will have their active subpage ID set to null
  return initialSubPageIds;
};

// This is used to generate a map of page IDs to their indices in the pager
const getPageIdToIndexMap = (children: React.ReactElement<PageProps | GroupProps>[]): Record<PageId, number> => {
  const obj: Record<PageId, number> = {};
  let pageIndex = 0;
  children.forEach(child => {
    if ('id' in child.props && 'component' in child.props) {
      obj[child.props.id] = pageIndex;
      pageIndex += 1;
    } else if ('children' in child.props) {
      child.props.children.forEach(page => {
        if ('id' in page.props && 'component' in page.props) {
          obj[page.props.id] = pageIndex;
        }
      });
      pageIndex += 1;
    }
  });
  return obj;
};

interface SmoothPagerProps {
  children: React.ReactElement<PageProps | GroupProps>[];
  enableSwipeToGoBack?: boolean;
  enableSwipeToGoForward?: boolean;
  initialPage: PageId;
  pageGap?: number;
  verticalPageAlignment?: AlignVertical;
}

const SmoothPagerComponent = (
  {
    children,
    enableSwipeToGoBack = true,
    enableSwipeToGoForward = true,
    initialPage,
    pageGap = 0,
    verticalPageAlignment = 'bottom',
  }: SmoothPagerProps,
  ref: ForwardedRef<SmoothPagerRef>
) => {
  const pageIdToIndex = useMemo(() => getPageIdToIndexMap(children), [children]);

  const activeSubPageIds = useSharedValue<ActiveSubPageIds>(initializeActiveSubPageIds(pageIdToIndex, initialPage));
  const currentPageId = useSharedValue(initialPage);
  const currentPageIndex = useSharedValue(pageIdToIndex[initialPage] ?? 0);
  const deepestReachedPageIndex = useSharedValue(pageIdToIndex[initialPage] ?? 0);

  // This represents the number of page slots in the pager (treating page groups as a single page)
  const numberOfPages = useMemo(() => children.length, [children.length]);

  useImperativeHandle(ref, () => ({
    goBack() {
      runOnUI(() => {
        const currentPageIndexValue = Math.round(currentPageIndex.value);
        if (currentPageIndexValue > 0) {
          currentPageIndex.value = withTiming(currentPageIndexValue - 1, PAGE_ANIMATION_CONFIG);
        }
      })();
    },
    goToPage(id: PageId) {
      runOnUI(() => {
        const pageIndex = pageIdToIndex[id];
        if (pageIndex !== undefined) {
          currentPageIndex.value = withTiming(pageIndex, PAGE_ANIMATION_CONFIG);
          currentPageId.value = id;
        }
      })();
    },
  }));

  // This handles making the correct subpage active when navigating to pages that exist within page groups. It also
  // manages the setting and resetting of the deepest reached page, which is used to control whether forward swipe
  // gestures are allowed (if forward swipe gestures are enabled on the pager).
  useAnimatedReaction(
    () => ({ currentPageId: currentPageId.value }),
    (current, previous) => {
      const didPageIdChange = previous?.currentPageId && current.currentPageId !== previous.currentPageId;

      if (didPageIdChange) {
        const previousPageIndex = pageIdToIndex[previous.currentPageId];
        const pageIndex = pageIdToIndex[current.currentPageId];
        const currentActiveSubPageId = activeSubPageIds.value[pageIndex];

        // If currentActiveSubPageId is not null here, the current page is in a page group
        if (currentActiveSubPageId !== null) {
          if (currentActiveSubPageId === '') {
            // This page group has not been reached since the last navigation path reset
            activeSubPageIds.modify(value => {
              // Set the active subpage ID to the current page ID
              value[pageIndex] = current.currentPageId;
              return value;
            });
            // Because this page group has not yet been reached, it is now the deepest reached page
            deepestReachedPageIndex.value = pageIndex;
          } else if (currentActiveSubPageId !== current.currentPageId) {
            // Reset the navigation path because the current path deviated from the last taken path
            activeSubPageIds.modify(value => {
              value[pageIndex] = current.currentPageId;
              Object.keys(value).forEach(key => {
                const index = parseInt(key, 10);
                if (index > pageIndex && value[index] !== null) {
                  value[index] = '';
                }
              });
              return value;
            });
            // This is now the deepest reached page
            deepestReachedPageIndex.value = pageIndex;
          }
        } else {
          // The current page is not in a page group
          if (pageIndex > previousPageIndex && pageIndex > deepestReachedPageIndex.value) {
            // Update the deepest reached page if this page is deeper than the previous deepest reached page
            deepestReachedPageIndex.value = pageIndex;
          }
        }
      }
    }
  );

  const pagerWrapperStyle = useAnimatedStyle(() => {
    const totalWidth = numberOfPages * DEVICE_WIDTH + (numberOfPages - 1) * pageGap;
    const translateX = interpolate(currentPageIndex.value, [0, numberOfPages - 1], [0, -totalWidth + DEVICE_WIDTH]);

    return {
      transform: [{ translateX }],
    };
  });

  const swipeGestureHandler = useAnimatedGestureHandler({
    onStart: (event, context: { startX: number; startPage: number }) => {
      context.startPage = Math.round(currentPageIndex.value);
      context.startX = event.translationX;
    },
    onActive: (event, context: { startX: number; startPage: number }) => {
      const dragDistance = event.translationX - context.startX;
      const dragPages = dragDistance / (DEVICE_WIDTH + pageGap);
      let newPageIndex = context.startPage - dragPages;

      const forwardSwipeEnabled = enableSwipeToGoForward && deepestReachedPageIndex.value > currentPageIndex.value;

      if (enableSwipeToGoBack && forwardSwipeEnabled) {
        newPageIndex = clamp(newPageIndex, 0, numberOfPages - 1);
      } else if (enableSwipeToGoBack && dragDistance > 0) {
        newPageIndex = clamp(newPageIndex, 0, context.startPage);
      } else if (forwardSwipeEnabled && dragDistance < 0) {
        newPageIndex = clamp(newPageIndex, context.startPage, numberOfPages - 1);
      } else {
        newPageIndex = context.startPage;
      }

      currentPageIndex.value = newPageIndex;
    },
    onEnd: (event, context: { startX: number; startPage: number }) => {
      const swipeVelocityThreshold = 300;
      let targetPage = currentPageIndex.value;

      if (event.velocityX < -swipeVelocityThreshold && enableSwipeToGoForward) {
        targetPage = Math.ceil(currentPageIndex.value);
      } else if (event.velocityX > swipeVelocityThreshold && enableSwipeToGoBack) {
        targetPage = Math.floor(currentPageIndex.value);
      } else {
        targetPage = Math.round(currentPageIndex.value);
      }

      const forwardSwipeEnabled = enableSwipeToGoForward && deepestReachedPageIndex.value > currentPageIndex.value;

      if (enableSwipeToGoBack && !forwardSwipeEnabled) {
        targetPage = clamp(targetPage, 0, context.startPage);
      } else if (!enableSwipeToGoBack && forwardSwipeEnabled) {
        targetPage = clamp(targetPage, context.startPage, numberOfPages - 1);
      } else {
        targetPage = clamp(targetPage, 0, numberOfPages - 1);
      }

      currentPageIndex.value = withTiming(targetPage, PAGE_ANIMATION_CONFIG);
    },
  });

  return (
    // @ts-expect-error Property 'children' does not exist on type
    <PanGestureHandler
      activeOffsetX={[-5, 5]}
      failOffsetY={[-10, 10]}
      enabled={enableSwipeToGoBack || enableSwipeToGoForward}
      onGestureEvent={swipeGestureHandler}
    >
      <Animated.View style={styles.pagerContainer}>
        <Animated.View
          style={[
            styles.pagerWrapper,
            pagerWrapperStyle,
            {
              justifyContent: verticalPageAlignment ? alignVerticalToFlexAlign[verticalPageAlignment] : undefined,
              gap: pageGap,
              width: numberOfPages * DEVICE_WIDTH + (numberOfPages - 1) * pageGap,
            },
          ]}
        >
          {children.map((child, index) => {
            if ('component' in child.props) {
              // Handle top-level Page components
              const { id, component } = child.props;
              return (
                <Page
                  child={component}
                  currentPageId={currentPageId}
                  currentPageIndex={currentPageIndex}
                  id={id}
                  index={index}
                  key={id}
                  verticalPageAlignment={verticalPageAlignment}
                />
              );
            } else if ('children' in child.props) {
              // Handle page groups with subpages (Page components) within
              const { children: subPages } = child.props;
              const pageGroupKey = subPages.map(subPage => subPage.props.id).join('-');
              return (
                <PageGroup
                  activeSubPageIds={activeSubPageIds}
                  currentPageId={currentPageId}
                  currentPageIndex={currentPageIndex}
                  index={index}
                  key={pageGroupKey}
                  subPages={subPages}
                  verticalPageAlignment={verticalPageAlignment}
                />
              );
            }
          })}
        </Animated.View>
      </Animated.View>
    </PanGestureHandler>
  );
};

/**
 * ### `🫧 SmoothPager 🫧`
 *
 * Enables horizontal navigation between multiple pages with smooth, animated transitions and built-in swipe gestures.
 * It supports individual pages and grouped pages, and allows programmatic navigation via the `usePagerNavigation` hook.
 *
 * - `enableSwipeToGoBack: boolean` and `enableSwipeToGoForward: boolean` allow control over swipe behaviors.
 * - `initialPage: string` allows setting the initially active page by specifying its `id`.
 * - `pageGap: number` defines the spacing between consecutive pages.
 * - `verticalPageAlignment: 'top' | 'center' | 'bottom'` specifies how pages should align vertically in the event the
 * heights of the pages are inconsistent.
 *
 * @example
 * ```jsx
 * const { goBack, goToPage, ref } = usePagerNavigation();
 *
 * return (
 *   <SmoothPager initialPage="home" ref={ref}>
 *     <SmoothPager.Page component={<Home goToPage={goToPage} />} id="home" />
 *     <SmoothPager.Group>
 *       <SmoothPager.Page component={<About goBack={goBack} />} id="about" />
 *       <SmoothPager.Page component={<Contact goBack={goBack} />} id="contact" />
 *     </SmoothPager.Group>
 *   </SmoothPager>
 * );
 * ```
 */
export const SmoothPager = Object.assign(React.memo(forwardRef<SmoothPagerRef, SmoothPagerProps>(SmoothPagerComponent)), {
  /**
   * `SmoothPager.Page` defines an individual page within the `SmoothPager`, and must be given the following props:
   *
   * - `id`: The unique identifier for the page, used when navigating via `goToPage(id)`.
   * - `component`: The React component to render within the page.
   *
   * Each page must also be a direct child of either `SmoothPager` or `SmoothPager.Group`.
   */
  Page: PagerPage,

  /**
   * `SmoothPager.Group` allows multiple pages to share the same physical slot in the pager, and can be used to create
   * conditional navigation paths within the pager. This is particularly useful for scenarios where multiple pages are
   * potential candidates for being the next visible page, based on the action taken by the user on the preceding page.
   *
   * - Must be a direct child of `SmoothPager`.
   * - Houses multiple `SmoothPager.Page` components as children, one of which will become active based on the
   * navigation path taken.
   */
  Group: PagerGroup,
});

interface PageGroupComponentProps {
  activeSubPageIds: SharedValue<ActiveSubPageIds>;
  currentPageId: SharedValue<string>;
  currentPageIndex: SharedValue<number>;
  index: number;
  subPages: React.ReactElement<PageProps>[];
  verticalPageAlignment: AlignVertical;
}

const PageGroup = React.memo(function PageGroup({
  activeSubPageIds,
  currentPageId,
  currentPageIndex,
  index,
  subPages,
  verticalPageAlignment,
}: PageGroupComponentProps) {
  return (
    <Box style={styles.pageStyle}>
      {subPages.map(subPage => (
        <Page
          activeSubPageIds={activeSubPageIds}
          child={subPage.props.component}
          currentPageId={currentPageId}
          currentPageIndex={currentPageIndex}
          id={subPage.props.id}
          index={index}
          isSubPage
          key={subPage.props.id}
          verticalPageAlignment={verticalPageAlignment}
        />
      ))}
    </Box>
  );
});

interface PageComponentProps {
  activeSubPageIds?: SharedValue<ActiveSubPageIds>;
  child: React.ReactElement;
  currentPageId: SharedValue<string>;
  currentPageIndex: SharedValue<number>;
  id: PageId;
  index: number;
  isSubPage?: boolean;
  verticalPageAlignment: AlignVertical;
}

const Page = React.memo(function Page({
  activeSubPageIds,
  child,
  currentPageId,
  currentPageIndex,
  id,
  index,
  isSubPage,
  verticalPageAlignment,
}: PageComponentProps) {
  const pageRef = useAnimatedRef();

  const pageStyle = useAnimatedStyle(() => {
    const isActiveSubPage = isSubPage ? activeSubPageIds?.value[index] === id || currentPageId.value === id : true;
    const display = isActiveSubPage ? 'flex' : 'none';
    const opacity = interpolate(currentPageIndex.value, [index - 1, index - 0.9, index, index + 0.9, index + 1], [0, 1, 1, 1, 0], 'clamp');
    const scale = interpolate(currentPageIndex.value, [index - 1, index, index + 1], [0.8, 1, 0.8], 'clamp');

    return {
      display,
      opacity,
      transform: [{ scale: opacity === 0 ? 0 : scale }],
    };
  });

  return (
    <Animated.View
      ref={pageRef}
      style={[
        styles.pageStyle,
        pageStyle,
        { justifyContent: alignVerticalToFlexAlign[verticalPageAlignment] },
        isSubPage && styles.subPageStyle,
      ]}
    >
      {child}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  pageStyle: {
    alignItems: 'center',
    height: '100%',
    pointerEvents: 'box-none',
    width: DEVICE_WIDTH,
  },
  pagerContainer: {
    flex: 1,
    pointerEvents: 'box-none',
    width: DEVICE_WIDTH,
  },
  pagerWrapper: {
    flexDirection: 'row',
    pointerEvents: 'box-none',
  },
  subPageStyle: {
    alignItems: 'center',
    bottom: 0,
    height: '100%',
    left: 0,
    position: 'absolute',
    width: DEVICE_WIDTH,
  },
  subPageWrapperStyle: {
    position: 'absolute',
  },
});
