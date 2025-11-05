import React, { ForwardedRef, forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated, {
  DerivedValue,
  SharedValue,
  WithSpringConfig,
  WithTimingConfig,
  interpolate,
  runOnJS,
  runOnUI,
  useAnimatedGestureHandler,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box } from '@/design-system';
import { AlignVertical, alignVerticalToFlexAlign } from '@/design-system/layout/alignment';
import { useStableValue } from '@/hooks/useStableValue';
import { clamp } from '@/__swaps__/utils/swaps';
import { deviceUtils } from '@/utils';

// ============ Constants ====================================================== //

const DEVICE_WIDTH = deviceUtils.dimensions.width;
const PAGE_ANIMATION_CONFIG = TIMING_CONFIGS.slowerFadeConfig;

const PagerGroup: React.FC<GroupProps> = ({ children }) => <>{children}</>;
const PagerPage: React.FC<PageProps> = ({ component }) => <>{component}</>;

// ============ Types ========================================================== //

type PageId = string;
type ActiveSubPageIds = Record<number, string | null>;

type GroupProps = {
  children: React.ReactElement<PageProps>[];
};

type PageProps = {
  component: React.ReactElement;
  id: PageId;
  lazy?: boolean;
};

type SmoothPagerRef = {
  currentPageIndex: SharedValue<number>;
  goBack: () => void;
  goForward: () => void;
  goToPage: (id: PageId) => void;
};

// ============ Hooks ========================================================== //

export function usePagerNavigation<T extends string = PageId>() {
  const ref = useRef<SmoothPagerRef>(null);
  return useMemo(
    () => ({
      ref,
      goBack: () => ref.current?.goBack(),
      goForward: () => ref.current?.goForward(),
      goToPage: (id: T) => ref.current?.goToPage(id),
    }),
    [ref]
  );
}

// ============ Animation Utils ================================================ //

const SCALE_FACTOR = 200;

/**
 * Converts a scaled page index back to its original value.
 */
export function downscalePagerIndex(scaledIndex: number): number {
  'worklet';
  return scaledIndex / SCALE_FACTOR;
}

/**
 * Upscales a page index for use in animation.
 */
export function upscalePagerIndex(index: number): number {
  'worklet';
  return index * SCALE_FACTOR;
}

// ============ SmoothPager ==================================================== //

type SmoothPagerProps = {
  children: React.ReactElement<PageProps | GroupProps>[];
  enableSwipeToGoBack?: boolean;
  enableSwipeToGoForward?: boolean | 'always';
  initialPage: PageId;
  lazy?: boolean;
  onNewIndex?: (index: number) => void;
  pageGap?: number;
  scaleTo?: number;
  verticalPageAlignment?: AlignVertical;
} & (
  | { springConfig?: WithSpringConfig; springVelocityFactor?: number; timingConfig?: undefined }
  | { springConfig?: undefined; springVelocityFactor?: undefined; timingConfig?: WithTimingConfig }
);

const SmoothPagerComponent = (
  {
    children,
    enableSwipeToGoBack = true,
    enableSwipeToGoForward = true,
    initialPage,
    lazy = false,
    onNewIndex,
    pageGap = 0,
    scaleTo = 0.8,
    springConfig,
    springVelocityFactor = 1,
    timingConfig,
    verticalPageAlignment = 'bottom',
  }: SmoothPagerProps,
  ref: ForwardedRef<SmoothPagerRef>
) => {
  const { initialIndex, initialSubpageIds, pageIdToIndex } = useStableValue(() => getInitialPagerState(children, initialPage));

  const activeSubPageIds = useSharedValue(initialSubpageIds);
  const currentPageId = useSharedValue(initialPage);
  const currentPageIndex = useSharedValue(upscalePagerIndex(initialIndex));
  const deepestReachedPageIndex = useSharedValue(initialIndex);
  const lastTargetIndex = useSharedValue(initialIndex);

  // This represents the number of page slots in the pager (treating page groups as a single page)
  const numberOfPages = children.length;

  const animateIndex = useCallback(
    (target: number, velocity?: number) => {
      'worklet';
      lastTargetIndex.value = target;
      if (springConfig) {
        currentPageIndex.value = withSpring(
          upscalePagerIndex(target),
          velocity ? { ...springConfig, velocity: velocity * springVelocityFactor } : springConfig
        );
      } else {
        currentPageIndex.value = withTiming(upscalePagerIndex(target), timingConfig ?? PAGE_ANIMATION_CONFIG);
      }
    },
    [currentPageIndex, lastTargetIndex, springConfig, springVelocityFactor, timingConfig]
  );

  useImperativeHandle(
    ref,
    () => ({
      currentPageIndex,

      goBack() {
        runOnUI(() => {
          const currentPageIndexValue = Math.round(downscalePagerIndex(currentPageIndex.value));
          if (currentPageIndexValue > 0) {
            const targetIndex = currentPageIndexValue - 1;
            requestAnimationFrame(() => animateIndex(targetIndex));
            if (!onNewIndex || lastTargetIndex.value === targetIndex) return;
            runOnJS(onNewIndex)(targetIndex);
          }
        })();
      },

      goForward() {
        runOnUI(() => {
          const currentPageIndexValue = Math.round(downscalePagerIndex(currentPageIndex.value));
          if (currentPageIndexValue < numberOfPages - 1) {
            const targetIndex = currentPageIndexValue + 1;
            requestAnimationFrame(() => animateIndex(targetIndex));
            if (!onNewIndex || lastTargetIndex.value === targetIndex) return;
            runOnJS(onNewIndex)(targetIndex);
          }
        })();
      },

      goToPage(id: PageId) {
        runOnUI(() => {
          const targetIndex = pageIdToIndex[id];
          if (targetIndex !== undefined) {
            requestAnimationFrame(() => animateIndex(targetIndex));
            currentPageId.value = id;
            if (!onNewIndex || lastTargetIndex.value === targetIndex) return;
            runOnJS(onNewIndex)(targetIndex);
          }
        })();
      },
    }),
    [animateIndex, currentPageId, currentPageIndex, lastTargetIndex, numberOfPages, onNewIndex, pageIdToIndex]
  );

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
    },
    []
  );

  const pagerWrapperStyle = useAnimatedStyle(() => {
    const totalWidth = numberOfPages * DEVICE_WIDTH + (numberOfPages - 1) * pageGap;
    const translateX = interpolate(downscalePagerIndex(currentPageIndex.value), [0, numberOfPages - 1], [0, -totalWidth + DEVICE_WIDTH]);
    return { transform: [{ translateX }] };
  });

  const swipeGestureHandler = useAnimatedGestureHandler({
    onStart: (
      _,
      context: {
        startPage?: number;
        startX?: number;
        maxForwardIndex?: number;
        canSwipeForward?: boolean;
      }
    ) => {
      context.canSwipeForward = undefined;
      context.maxForwardIndex = undefined;
      context.startPage = undefined;
      context.startX = undefined;
    },

    onActive: (event, context) => {
      if (context.startPage === undefined) {
        context.startPage = downscalePagerIndex(currentPageIndex.value);

        if (enableSwipeToGoForward === 'always') {
          context.canSwipeForward = true;
          context.maxForwardIndex = numberOfPages - 1;
        } else if (enableSwipeToGoForward) {
          context.canSwipeForward = deepestReachedPageIndex.value > context.startPage;
          context.maxForwardIndex = deepestReachedPageIndex.value;
        } else {
          context.canSwipeForward = false;
          context.maxForwardIndex = context.startPage;
        }
      }

      if (context.startX === undefined) context.startX = event.translationX;

      const dragDistance = event.translationX - context.startX;
      const dragPages = dragDistance / (DEVICE_WIDTH + pageGap);
      let newPageIndex = context.startPage - dragPages;

      const minIndex = enableSwipeToGoBack ? 0 : context.startPage;
      const maxIndex = context.maxForwardIndex ?? numberOfPages - 1;

      newPageIndex = clamp(newPageIndex, minIndex, maxIndex);
      currentPageIndex.value = upscalePagerIndex(newPageIndex);
    },

    onEnd: (event, context) => {
      if (context.startPage === undefined) return;

      const swipeVelocityThreshold = 300;
      const velocity = event.velocityX;
      let targetIndex = downscalePagerIndex(currentPageIndex.value);

      if (velocity < -swipeVelocityThreshold && context.canSwipeForward) {
        targetIndex = Math.ceil(targetIndex);
      } else if (velocity > swipeVelocityThreshold && enableSwipeToGoBack) {
        targetIndex = Math.floor(targetIndex);
      } else {
        targetIndex = Math.round(targetIndex);
      }

      const minIndex = enableSwipeToGoBack ? 0 : context.startPage;
      const maxIndex = context.maxForwardIndex ?? numberOfPages - 1;

      targetIndex = clamp(targetIndex, minIndex, maxIndex);

      animateIndex(targetIndex, -velocity);
      if (onNewIndex) runOnJS(onNewIndex)(targetIndex);
    },
  });

  return (
    <PanGestureHandler
      activeOffsetX={[-5, 5]}
      enabled={enableSwipeToGoBack || enableSwipeToGoForward !== false}
      failOffsetY={[-12, 12]}
      onGestureEvent={swipeGestureHandler}
    >
      <Animated.View style={styles.pagerContainer}>
        <Animated.View
          style={[
            styles.pagerWrapper,
            pagerWrapperStyle,
            {
              gap: pageGap,
              justifyContent: verticalPageAlignment ? alignVerticalToFlexAlign[verticalPageAlignment] : undefined,
              width: numberOfPages * DEVICE_WIDTH + (numberOfPages - 1) * pageGap,
            },
          ]}
        >
          {children.map((child, index) => {
            if ('component' in child.props) {
              // Handle top-level Page components
              const { component, id, lazy: lazyProp } = child.props;
              return (
                <Page
                  activeSubPageIds={undefined}
                  child={component}
                  currentPageId={currentPageId}
                  currentPageIndex={currentPageIndex}
                  id={id}
                  index={index}
                  initialPage={initialPage}
                  key={id}
                  lazy={lazyProp ?? lazy}
                  isSubPage={undefined}
                  scaleTo={scaleTo}
                  verticalPageAlignment={verticalPageAlignment}
                />
              );
            } else if ('children' in child.props) {
              // Handle page groups with subpages (Page components) within
              const subPages = child.props.children;
              const pageGroupKey = subPages.map(subPage => subPage.props.id).join('-');
              return (
                <PageGroup
                  activeSubPageIds={activeSubPageIds}
                  currentPageId={currentPageId}
                  currentPageIndex={currentPageIndex}
                  index={index}
                  initialPage={initialPage}
                  key={pageGroupKey}
                  lazy={lazy}
                  scaleTo={scaleTo}
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
 * - `enableSwipeToGoBack: boolean` and `enableSwipeToGoForward: boolean | 'always'` allow control over swipe behaviors.
 * - `enableSwipeToGoForward: 'always'` allows forward swipe gestures to be enabled even when the current page is the
 * deepest reached page.
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

// ============ Page Group Component =========================================== //

type PageGroupComponentProps = {
  activeSubPageIds: SharedValue<ActiveSubPageIds>;
  currentPageId: SharedValue<string>;
  currentPageIndex: SharedValue<number>;
  index: number;
  initialPage: PageId;
  lazy: boolean;
  scaleTo: number;
  subPages: React.ReactElement<PageProps>[];
  verticalPageAlignment: AlignVertical;
};

const PageGroup = React.memo(function PageGroup({
  activeSubPageIds,
  currentPageId,
  currentPageIndex,
  index,
  initialPage,
  lazy,
  scaleTo,
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
          initialPage={initialPage}
          isSubPage={true}
          key={subPage.props.id}
          lazy={lazy}
          scaleTo={scaleTo}
          verticalPageAlignment={verticalPageAlignment}
        />
      ))}
    </Box>
  );
});

// ============ Page Component ================================================= //

type PageComponentProps = {
  activeSubPageIds: SharedValue<ActiveSubPageIds> | undefined;
  child: React.ReactElement;
  currentPageId: SharedValue<string>;
  currentPageIndex: SharedValue<number>;
  id: PageId;
  index: number;
  initialPage: PageId;
  isSubPage: boolean | undefined;
  lazy: boolean;
  scaleTo: number;
  verticalPageAlignment: AlignVertical;
};

const Page = React.memo(function Page({
  activeSubPageIds,
  child,
  currentPageId,
  currentPageIndex,
  id,
  index,
  initialPage,
  isSubPage,
  lazy,
  scaleTo,
  verticalPageAlignment,
}: PageComponentProps) {
  const pageRef = useAnimatedRef();

  const shouldDisplay = useDerivedValue(() => (isSubPage ? activeSubPageIds?.value[index] === id || currentPageId.value === id : true));
  const opacity = useDerivedValue(() =>
    interpolate(
      downscalePagerIndex(currentPageIndex.value),
      [index - 1, index - 0.9, index, index + 0.9, index + 1],
      [0, 1, 1, 1, 0],
      'clamp'
    )
  );

  const pageStyle = useAnimatedStyle(() => {
    const currentOpacity = opacity.value;
    const display = shouldDisplay.value ? 'flex' : 'none';
    const scale = interpolate(downscalePagerIndex(currentPageIndex.value), [index - 1, index, index + 1], [scaleTo, 1, scaleTo], 'clamp');

    return {
      display,
      opacity: currentOpacity,
      transform: scaleTo === 1 ? undefined : [{ scale: currentOpacity === 0 ? 0 : scale }],
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
      {lazy ? (
        <MountIfActive id={id} initialPage={initialPage} opacity={opacity} shouldDisplay={shouldDisplay}>
          {child}
        </MountIfActive>
      ) : (
        child
      )}
    </Animated.View>
  );
});

const MountIfActive = ({
  children,
  id,
  initialPage,
  opacity,
  shouldDisplay,
}: {
  children: React.ReactElement;
  id: PageId;
  initialPage: PageId;
  opacity: DerivedValue<number>;
  shouldDisplay: SharedValue<boolean>;
}) => {
  const [shouldMount, setShouldMount] = useState(() => initialPage === id);

  useAnimatedReaction(
    () => shouldDisplay.value && opacity.value > 0,
    (isActive, previous) => {
      if (!isActive || isActive === previous) return;
      if (!shouldMount) runOnJS(setShouldMount)(isActive);
    },
    []
  );

  return shouldMount ? children : null;
};

// ============ Helper Functions =============================================== //

type InitialPagerState = {
  initialIndex: number;
  initialSubpageIds: ActiveSubPageIds;
  pageIdToIndex: Record<PageId, number>;
};

function getInitialPagerState(children: SmoothPagerProps['children'], initialPage: PageId): InitialPagerState {
  const pageIdToIndex = getPageIdToIndexMap(children);
  return {
    initialIndex: pageIdToIndex[initialPage] ?? 0,
    initialSubpageIds: initializeActiveSubPageIds(pageIdToIndex, initialPage),
    pageIdToIndex,
  };
}

/**
 * Used to initialize the shared value that keeps track of the active subpage ID for each page group.
 */
function initializeActiveSubPageIds(pageIdToIndex: Record<PageId, number>, initialPage?: PageId): ActiveSubPageIds {
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
}

/**
 * Used to generate a map of page IDs to their indices in the pager.
 */
function getPageIdToIndexMap(children: React.ReactElement<PageProps | GroupProps>[]): Record<PageId, number> {
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
}

// ============ Styles ========================================================= //

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
