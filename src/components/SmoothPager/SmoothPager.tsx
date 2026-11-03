import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  makeMutable,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  type SharedValue,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { alignVerticalToFlexAlign, type AlignVertical } from '@/design-system/layout/alignment';
import { IS_DEV } from '@/env';
import { useStableValue } from '@/hooks/useStableValue';
import { type PagerNavigation, type PagerNavigationState } from '@/navigation/pagerNavigation';
import { deviceUtils } from '@/utils/deviceUtils';

import {
  beginPagerGesture,
  cancelPagerAnimations,
  createPagerGestureState,
  downscalePagerIndex,
  finishPagerGesture,
  NO_PAGER_GESTURE_TARGETS,
  PAGER_REST_DISABLED,
  PAGER_REST_IDLE,
  requestPagerRest,
  setPagerGestureTargets,
  shouldCommitPagerGesture,
  transitionToPage,
  updatePagerGesture,
  upscalePagerIndex,
  type PagerAnimation,
  type PagerGestureState,
  type PagerGestureTargets,
  type PagerPosition,
  type PagerRestState,
  type PagerSide,
} from './pagerWorklets';

export { downscalePagerIndex, upscalePagerIndex } from './pagerWorklets';

// ============ Constants ====================================================== //

const DEVICE_WIDTH = deviceUtils.dimensions.width;
const DEFAULT_ANIMATION_CONFIG = TIMING_CONFIGS.slowerFadeConfig;
const HORIZONTAL_ACTIVATION_DISTANCE = 5;
const VERTICAL_FAILURE_DISTANCE = 12;
const SWIPE_VELOCITY_THRESHOLD = 300;

// ============ Types ========================================================== //

type PageProps<Page extends string = string> = {
  children: React.ReactElement;
  id: Page;
  lazy?: boolean;
};

type PagerHistory<Page extends string> = PagerNavigation<Page> & {
  goBack: () => void;
  goForward: () => void;
};

type PagerGestureCandidates = readonly [
  historyBackIndex: number,
  declarationPreviousIndex: number,
  declarationNextIndex: number,
  historyForwardIndex: number,
];

type ExternalGesture = Parameters<ReturnType<typeof Gesture.Pan>['requireExternalGestureToFail']>[0];

type SmoothPagerProps<Page extends string = string> = {
  children: React.ReactElement<PageProps<Page>> | React.ReactElement<PageProps<Page>>[];
  enableSwipeToGoBack?: boolean;
  /** `true` allows swiping to a previously reached forward page; `'always'` also allows the next declared page. */
  enableSwipeToGoForward?: boolean | 'always';
  fillHeight?: boolean;
  lazy?: boolean;
  /** Called when the destination page becomes interactive, before its transition finishes. */
  onPageActivated?: (page: Page) => void;
  pageGap?: number;
  /**
   * Optional shared value that follows pager motion.
   * Initialize it with `upscalePagerIndex`; use `downscalePagerIndex` to read page units.
   */
  pageIndex?: SharedValue<number>;
  scaleTo?: number;
  verticalPageAlignment?: AlignVertical;
  /** Waits for these gestures to fail before recognizing a pager swipe. */
  waitFor?: ExternalGesture | ExternalGesture[];
} & (
  | { fallbackPage?: never; initialPage: Page; navigation?: undefined }
  | {
      /** Initial page to use when the navigation state points to a page that is not declared here. */
      fallbackPage?: Page;
      initialPage?: never;
      /** Controls the active page and its back and forward history. */
      navigation: PagerNavigation<Page>;
    }
) &
  ({ springConfig?: WithSpringConfig; timingConfig?: undefined } | { springConfig?: undefined; timingConfig?: WithTimingConfig });

type LazyContentRegistration = {
  mount?: () => void;
  mountRequested: boolean;
  mounted: boolean;
  onMounted?: () => void;
};

type PageRegistry<Page extends string = string> = {
  activeIndex: SharedValue<number>;
  afterContentMounts?: () => void;
  afterRest?: () => void;
  fallbackPage?: Page;
  forwardGestureMode: NonNullable<SmoothPagerProps['enableSwipeToGoForward']>;
  furthestIndex?: number;
  gestureCommitPage?: Page;
  gestureState?: PagerGestureState;
  ids: readonly Page[];
  indexById: ReadonlyMap<Page, number>;
  initialIndex: number;
  lazyContent: readonly (LazyContentRegistration | undefined)[];
  mounted: boolean;
  navigation?: PagerNavigation<Page>;
  navigationState: PagerNavigationState<Page>;
  pageIndex?: SharedValue<number>;
  pendingContentMounts: number;
  positions: readonly PagerPosition[];
  restState?: SharedValue<PagerRestState>;
  supportsBackGesture: boolean;
};

// ============ Hooks ========================================================== //

/**
 * Creates a stable navigation controller whose back and forward actions follow the pages actually visited.
 * Navigating to a new page records the current page and clears the forward history.
 */
export function usePagerHistory<Page extends string>(initialPage: Page): PagerHistory<Page> {
  return useStableValue(() => {
    const back: Page[] = [];
    const forward: Page[] = [];
    const listeners = new Set<(nextState: PagerNavigationState<Page>) => void>();

    let state: PagerNavigationState<Page> = { page: initialPage };

    function publish(page: Page): void {
      state = { back: back.at(-1), forward: forward.at(-1), page };
      listeners.forEach(listener => listener(state));
    }

    return {
      getState: () => state,
      goBack: () => {
        const page = back.pop();
        if (page === undefined) return;
        forward.push(state.page);
        publish(page);
      },
      goForward: () => {
        const page = forward.pop();
        if (page === undefined) return;
        back.push(state.page);
        publish(page);
      },
      navigate: page => {
        if (page === state.page) return;
        back.push(state.page);
        forward.length = 0;
        publish(page);
      },
      subscribe: listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
  });
}

// ============ SmoothPager ==================================================== //

const PagerPage = <Page extends string>({ children }: PageProps<Page>) => children;

const SmoothPagerComponent = <Page extends string>({
  children,
  enableSwipeToGoBack = true,
  enableSwipeToGoForward = true,
  fallbackPage,
  fillHeight = false,
  initialPage,
  lazy = false,
  navigation,
  onPageActivated,
  pageGap = 0,
  pageIndex,
  scaleTo = 0.8,
  springConfig,
  timingConfig,
  verticalPageAlignment = 'bottom',
  waitFor,
}: SmoothPagerProps<Page>) => {
  const pageElements = getPageElements(children);
  const registry = useStableValue(() =>
    createPageRegistry(pageElements, initialPage, fallbackPage, lazy, enableSwipeToGoBack, enableSwipeToGoForward, navigation, pageIndex)
  );

  if (IS_DEV) {
    validateStablePagerConfiguration(
      pageElements,
      initialPage,
      fallbackPage,
      lazy,
      enableSwipeToGoBack,
      enableSwipeToGoForward,
      navigation,
      pageIndex,
      registry
    );
  }

  const { activeIndex, gestureState, pageIndex: animatedPageIndex, positions, restState } = registry;
  const animation = useMemo<PagerAnimation>(
    () => (springConfig ? { type: 'spring', config: springConfig } : { type: 'timing', config: timingConfig ?? DEFAULT_ANIMATION_CONFIG }),
    [springConfig, timingConfig]
  );

  const scheduleGestureTargets = useMemo(() => {
    if (!gestureState) return undefined;
    return runOnUI((expectedActiveIndex: number, targets: PagerGestureTargets) => {
      setPagerGestureTargets(activeIndex, gestureState, expectedActiveIndex, targets);
    });
  }, [activeIndex, gestureState]);

  const publishGestureTargets = useCallback(() => {
    if (!scheduleGestureTargets || !registry.mounted) return;

    const state = registry.navigationState;
    const currentIndex = registry.indexById.get(state.page);
    if (currentIndex === undefined) return;

    const candidates = getGestureCandidates(registry, state, currentIndex);
    const readyTargets = resolveReadyGestureTargets(registry, candidates, currentIndex);

    scheduleGestureTargets(currentIndex, readyTargets);
  }, [registry, scheduleGestureTargets]);

  const preparePageLifecycle = useCallback(
    (expectedActiveIndex: number) => {
      if (!registry.mounted || registry.indexById.get(registry.navigationState.page) !== expectedActiveIndex) return;

      const candidates = getGestureCandidates(registry, registry.navigationState, expectedActiveIndex);
      const publishWhenPrepared = () => {
        if (registry.indexById.get(registry.navigationState.page) !== expectedActiveIndex) return;
        disableCompletedLazyLifecycle(registry);
        publishGestureTargets();
      };

      for (const index of getPreparationTargets(registry, expectedActiveIndex, candidates)) requestContentMount(registry, index);

      runAfterContentMounts(registry, publishWhenPrepared);
    },
    [publishGestureTargets, registry]
  );

  const handlePagerSettled = useCallback(
    (settledIndex: number) => {
      const afterRest = registry.afterRest;
      registry.afterRest = undefined;
      if (afterRest) afterRest();
      else preparePageLifecycle(settledIndex);
    },
    [preparePageLifecycle, registry]
  );

  const onPagerSettled = restState ? handlePagerSettled : undefined;

  const notifyPageActivated = useMemo(
    () =>
      onPageActivated
        ? (targetIndex: number) => {
            const page = registry.ids[targetIndex];
            if (registry.mounted && page !== undefined && registry.navigationState.page === page) onPageActivated(page);
          }
        : undefined,
    [onPageActivated, registry]
  );

  const schedulePageTransition = useMemo(
    () =>
      runOnUI((targetIndex: number, nextTargets: PagerGestureTargets) => {
        transitionToPage(
          positions,
          activeIndex,
          gestureState,
          animatedPageIndex,
          restState,
          targetIndex,
          nextTargets,
          animation,
          onPagerSettled
        );

        if (notifyPageActivated) runOnJS(notifyPageActivated)(targetIndex);
      }),
    [activeIndex, animation, animatedPageIndex, gestureState, notifyPageActivated, onPagerSettled, positions, restState]
  );

  const requestPage = useCallback(
    (targetIndex: number) => {
      const targetId = registry.ids[targetIndex];
      if (targetId === undefined || registry.navigationState.page !== targetId) return;

      requestContentMount(registry, targetIndex);

      runAfterContentMounts(registry, () => {
        if (!registry.mounted || registry.navigationState.page !== targetId) return;
        disableCompletedLazyLifecycle(registry);
        const candidates = getGestureCandidates(registry, registry.navigationState, targetIndex);
        const readyTargets = resolveReadyGestureTargets(registry, candidates, targetIndex);
        schedulePageTransition(targetIndex, readyTargets);
      });
    },
    [registry, schedulePageTransition]
  );

  const schedulePagerRest = useMemo(() => {
    if (!onPagerSettled || !restState) return undefined;
    return runOnUI(() => {
      requestPagerRest(positions, activeIndex, gestureState, animatedPageIndex, restState, animation, onPagerSettled);
    });
  }, [activeIndex, animatedPageIndex, animation, gestureState, onPagerSettled, positions, restState]);

  const handleNavigationState = useCallback(
    (nextState: PagerNavigationState<Page>) => {
      const targetIndex = registry.indexById.get(nextState.page);
      if (targetIndex === undefined || !registry.mounted) return;

      const previousState = registry.navigationState;
      const sourceIndex = registry.indexById.get(previousState.page) ?? registry.initialIndex;
      const confirmsGesture = registry.gestureCommitPage === nextState.page;
      registry.navigationState = nextState;

      if (confirmsGesture) {
        registry.gestureCommitPage = undefined;
        publishGestureTargets();
        return;
      }

      registry.afterRest = undefined;

      const targetReady = isPageReady(registry, targetIndex);

      if (!targetReady && registry.pendingContentMounts === 0) {
        registry.afterRest = () => requestPage(targetIndex);
        schedulePagerRest?.();
      } else {
        const transitionIsDeferred = !targetReady || registry.pendingContentMounts !== 0;
        if (sourceIndex !== targetIndex && transitionIsDeferred) scheduleGestureTargets?.(sourceIndex, NO_PAGER_GESTURE_TARGETS);
        requestPage(targetIndex);
      }
    },
    [publishGestureTargets, registry, requestPage, scheduleGestureTargets, schedulePagerRest]
  );

  const commitGestureNavigation = useCallback(
    (expectedIndex: number, targetIndex: number) => {
      const state = registry.navigationState;
      const targetId = registry.ids[targetIndex];
      if (registry.indexById.get(state.page) !== expectedIndex || !targetId) return;

      if (navigation) {
        registry.gestureCommitPage = targetId;
        if (state.back === targetId && navigation.goBack) navigation.goBack();
        else if (state.forward === targetId && navigation.goForward) navigation.goForward();
        else navigation.navigate(targetId);
        if (registry.gestureCommitPage === targetId) registry.gestureCommitPage = undefined;
        notifyPageActivated?.(targetIndex);
        return;
      }

      if (registry.furthestIndex !== undefined) registry.furthestIndex = Math.max(registry.furthestIndex, targetIndex);
      registry.navigationState = { page: targetId };

      publishGestureTargets();
      notifyPageActivated?.(targetIndex);
    },
    [navigation, notifyPageActivated, publishGestureTargets, registry]
  );

  const swipeGesture = useMemo(() => {
    if (!gestureState) return undefined;

    const gestureFor = (targetSide: PagerSide) =>
      createSwipeGesture({
        activeIndex,
        animation,
        gestureState,
        onCommit: commitGestureNavigation,
        onSettled: onPagerSettled,
        pageWidth: DEVICE_WIDTH + pageGap,
        pageIndex: animatedPageIndex,
        positions,
        restState,
        targetSide,
        waitFor,
      });

    const backGesture = enableSwipeToGoBack ? gestureFor(-1) : undefined;
    const forwardGesture = enableSwipeToGoForward !== false ? gestureFor(1) : undefined;

    return backGesture && forwardGesture ? Gesture.Race(backGesture, forwardGesture) : (backGesture ?? forwardGesture);
  }, [
    activeIndex,
    animation,
    animatedPageIndex,
    commitGestureNavigation,
    enableSwipeToGoBack,
    enableSwipeToGoForward,
    gestureState,
    onPagerSettled,
    pageGap,
    positions,
    restState,
    waitFor,
  ]);

  const cancelAnimations = useMemo(
    () =>
      runOnUI(() => {
        cancelPagerAnimations(positions, animatedPageIndex);
      }),
    [animatedPageIndex, positions]
  );

  useLayoutEffect(() => {
    registry.mounted = true;
    let unsubscribe: (() => void) | undefined;

    if (navigation) {
      unsubscribe = navigation.subscribe(handleNavigationState);

      const navigationState = navigation.getState();
      const initialState = registry.indexById.has(navigationState.page) ? navigationState : registry.navigationState;
      const initialStateIndex = registry.indexById.get(initialState.page);

      if (initialStateIndex === registry.initialIndex) {
        registry.navigationState = initialState;
        preparePageLifecycle(initialStateIndex);
        notifyPageActivated?.(initialStateIndex);
      } else {
        handleNavigationState(initialState);
      }
    } else {
      preparePageLifecycle(registry.initialIndex);
      notifyPageActivated?.(registry.initialIndex);
    }

    return () => {
      unsubscribe?.();
      registry.mounted = false;
      registry.afterContentMounts = undefined;
      registry.afterRest = undefined;
      cancelAnimations();
    };
  }, [cancelAnimations, handleNavigationState, navigation, notifyPageActivated, preparePageLifecycle, registry]);

  const content = (
    <View pointerEvents={swipeGesture ? 'auto' : 'box-none'} style={[styles.pagerContainer, fillHeight && styles.fillHeight]}>
      {pageElements.map((page, index) => {
        const id = registry.ids[index];
        const contentRegistration = registry.lazyContent[index];
        return (
          <PageFrame
            activeIndex={activeIndex}
            index={index}
            key={id}
            layoutAnchor={index === registry.initialIndex}
            pageGap={pageGap}
            position={positions[index]}
            scaleTo={scaleTo}
            verticalPageAlignment={verticalPageAlignment}
          >
            {contentRegistration ? (
              <LazyPageContent registration={contentRegistration}>{page.props.children}</LazyPageContent>
            ) : (
              page.props.children
            )}
          </PageFrame>
        );
      })}
    </View>
  );

  return swipeGesture ? <GestureDetector gesture={swipeGesture}>{content}</GestureDetector> : content;
};

/**
 * ### `🫧 SmoothPager 🫧`
 *
 * Displays one page at a time with horizontal animated transitions and optional swipe navigation.
 * Declare every page as a direct `SmoothPager.Page` child. Use `initialPage` for a pager navigated only by swipes,
 * or pass `navigation` to change pages programmatically and follow its back and forward history.
 *
 * Page order determines where pages sit horizontally, and lazy content mounts before its page is shown. The declared
 * page structure and navigation setup are fixed while mounted; remount the pager to change them.
 *
 * @example
 * ```tsx
 * const navigation = usePagerHistory<'home' | 'details'>('home');
 *
 * return (
 *   <SmoothPager navigation={navigation}>
 *     <SmoothPager.Page id="home">
 *       <Home onNext={() => navigation.navigate('details')} />
 *     </SmoothPager.Page>
 *     <SmoothPager.Page id="details">
 *       <Details onBack={navigation.goBack} />
 *     </SmoothPager.Page>
 *   </SmoothPager>
 * );
 * ```
 */
export const SmoothPager = Object.assign(SmoothPagerComponent, {
  /**
   * Declares a page within a `SmoothPager`.
   * It must be a direct child with a unique `id`; `lazy` overrides the pager's default for this page.
   */
  Page: PagerPage,
});

// ============ Swipe Gesture ================================================== //

type SwipeGestureConfig = {
  activeIndex: SharedValue<number>;
  animation: PagerAnimation;
  gestureState: PagerGestureState;
  onCommit: (expectedIndex: number, targetIndex: number) => void;
  onSettled: ((index: number) => void) | undefined;
  pageIndex: SharedValue<number> | undefined;
  pageWidth: number;
  positions: readonly PagerPosition[];
  restState: SharedValue<PagerRestState> | undefined;
  targetSide: PagerSide;
  waitFor: SmoothPagerProps['waitFor'];
};

function createSwipeGesture({
  activeIndex,
  animation,
  gestureState,
  onCommit,
  onSettled,
  pageIndex,
  pageWidth,
  positions,
  restState,
  targetSide,
  waitFor,
}: SwipeGestureConfig) {
  const gesture = Gesture.Pan()
    .maxPointers(1)
    .activeOffsetX(-targetSide * HORIZONTAL_ACTIVATION_DISTANCE)
    .failOffsetX(targetSide * HORIZONTAL_ACTIVATION_DISTANCE)
    .failOffsetY([-VERTICAL_FAILURE_DISTANCE, VERTICAL_FAILURE_DISTANCE])
    .onStart(() => {
      beginPagerGesture(positions, activeIndex, gestureState, pageIndex, targetSide);
    })
    .onChange(event => {
      updatePagerGesture(positions, gestureState, pageIndex, targetSide, event.changeX, pageWidth);
    })
    .onEnd((event, success) => {
      const encodedTarget = gestureState.gestureTarget;
      if (encodedTarget === 0) return;

      const expectedIndex = activeIndex.value;
      const nextIndex = encodedTarget - 1;
      const commit = success && shouldCommitPagerGesture(positions[nextIndex].value, event.velocityX, targetSide, SWIPE_VELOCITY_THRESHOLD);
      const settledIndex = finishPagerGesture(
        positions,
        activeIndex,
        gestureState,
        pageIndex,
        restState,
        targetSide,
        commit,
        success ? event.velocityX : 0,
        pageWidth,
        animation,
        onSettled
      );

      if (settledIndex !== -1 && settledIndex !== expectedIndex) runOnJS(onCommit)(expectedIndex, settledIndex);
    });

  if (waitFor) {
    if (!Array.isArray(waitFor)) gesture.requireExternalGestureToFail(waitFor);
    else for (const externalGesture of waitFor) gesture.requireExternalGestureToFail(externalGesture);
  }

  return gesture;
}

// ============ Page Components ================================================ //

const PageFrame = React.memo(function PageFrame({
  activeIndex,
  children,
  index,
  layoutAnchor,
  pageGap,
  position,
  scaleTo,
  verticalPageAlignment,
}: {
  activeIndex: SharedValue<number>;
  children: React.ReactElement;
  index: number;
  layoutAnchor: boolean;
  pageGap: number;
  position: SharedValue<number>;
  scaleTo: number;
  verticalPageAlignment: AlignVertical;
}) {
  const pageWidth = DEVICE_WIDTH + pageGap;
  const scaleRange = scaleTo - 1;

  const pageStyle = useAnimatedStyle(() => {
    const pagePosition = downscalePagerIndex(position.value);
    const distance = Math.min(Math.abs(pagePosition), 1);
    const opacity = distance <= 0.9 ? 1 : (1 - distance) * 10;
    const translateX = pagePosition * pageWidth;

    return {
      opacity,
      pointerEvents: activeIndex.value === index || distance < 1 ? ('box-none' as const) : ('none' as const),
      transform: scaleTo === 1 ? [{ translateX }] : [{ translateX }, { scale: opacity === 0 ? 0 : 1 + distance * scaleRange }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.page,
        layoutAnchor && styles.layoutAnchor,
        pageStyle,
        { justifyContent: alignVerticalToFlexAlign[verticalPageAlignment] },
      ]}
    >
      {children}
    </Animated.View>
  );
});

function LazyPageContent({ children, registration }: { children: React.ReactElement; registration: LazyContentRegistration }) {
  const [mounted, setMounted] = useState(registration.mounted);

  useLayoutEffect(() => {
    const mount = () => setMounted(true);
    registration.mount = mount;
    if (registration.mountRequested && !registration.mounted) setMounted(true);

    return () => {
      if (registration.mount === mount) registration.mount = undefined;
    };
  }, [registration]);

  useLayoutEffect(() => {
    if (!mounted) return;

    registration.mounted = true;
    registration.mountRequested = false;
    const onMounted = registration.onMounted;
    registration.onMounted = undefined;

    onMounted?.();
  }, [mounted, registration]);

  return mounted ? children : null;
}

// ============ Page Registry ================================================== //

function getPageElements<Page extends string>(children: SmoothPagerProps<Page>['children']): React.ReactElement<PageProps<Page>>[] {
  const pageElements: React.ReactElement<PageProps<Page>>[] = [];

  React.Children.forEach(children, child => {
    if (child === null) return;
    if (!React.isValidElement<PageProps<Page>>(child) || child.type !== PagerPage || typeof child.props.id !== 'string') {
      throw new Error('SmoothPager children must be SmoothPager.Page elements with string IDs.');
    }
    pageElements.push(child);
  });

  return pageElements;
}

function createPageRegistry<Page extends string>(
  pageElements: React.ReactElement<PageProps<Page>>[],
  initialPage: Page | undefined,
  fallbackPage: Page | undefined,
  defaultLazy: boolean,
  supportsBackGesture: boolean,
  forwardGestureMode: NonNullable<SmoothPagerProps['enableSwipeToGoForward']>,
  navigation: PagerNavigation<Page> | undefined,
  pageIndex: SharedValue<number> | undefined
): PageRegistry<Page> {
  const pageCount = pageElements.length;
  const ids = new Array<Page>(pageCount);
  const indexById = new Map<Page, number>();

  for (let index = 0; index < pageCount; index += 1) {
    const id = pageElements[index].props.id;
    if (indexById.has(id)) throw new Error(`SmoothPager page ID "${id}" is registered more than once.`);
    ids[index] = id;
    indexById.set(id, index);
  }

  const navigationState = navigation?.beginPath?.() ?? navigation?.getState();
  const initialNavigationState = navigationState && indexById.has(navigationState.page) ? navigationState : undefined;
  const resolvedInitialPage = initialNavigationState?.page ?? fallbackPage ?? initialPage;

  if (resolvedInitialPage === undefined) {
    throw new Error('SmoothPager requires an initial page.');
  }

  const initialIndex = indexById.get(resolvedInitialPage);

  if (initialIndex === undefined) {
    const page = navigationState?.page ?? resolvedInitialPage;
    throw new Error(`SmoothPager initial page "${String(page)}" is not registered.`);
  }

  const lazyContent = new Array<LazyContentRegistration | undefined>(pageCount);
  const positions = new Array<PagerPosition>(pageCount);
  let needsLifecyclePreparation = false;

  for (let index = 0; index < pageCount; index += 1) {
    const isLazy = pageElements[index].props.lazy ?? defaultLazy;
    const mounted = index === initialIndex || index === initialIndex + 1 || (supportsBackGesture && index === initialIndex - 1);
    const content = isLazy ? { mountRequested: false, mounted } : undefined;

    lazyContent[index] = content;
    positions[index] = makeMutable(index === initialIndex ? 0 : upscalePagerIndex(index < initialIndex ? -1 : 1));
    if (content && !mounted) needsLifecyclePreparation = true;
  }

  const hasGestures = supportsBackGesture || forwardGestureMode !== false;

  return {
    activeIndex: makeMutable(initialIndex),
    fallbackPage,
    forwardGestureMode,
    furthestIndex: !navigation && forwardGestureMode === true ? initialIndex : undefined,
    gestureState: hasGestures ? createPagerGestureState() : undefined,
    ids,
    indexById,
    initialIndex,
    lazyContent,
    mounted: false,
    navigation,
    navigationState: initialNavigationState ?? { page: resolvedInitialPage },
    pageIndex,
    pendingContentMounts: 0,
    positions,
    restState: needsLifecyclePreparation ? makeMutable(PAGER_REST_IDLE) : undefined,
    supportsBackGesture,
  };
}

function validateStablePagerConfiguration<Page extends string>(
  pageElements: React.ReactElement<PageProps<Page>>[],
  initialPage: Page | undefined,
  fallbackPage: Page | undefined,
  defaultLazy: boolean,
  enableSwipeToGoBack: boolean,
  enableSwipeToGoForward: SmoothPagerProps['enableSwipeToGoForward'],
  navigation: PagerNavigation<Page> | undefined,
  pageIndex: SharedValue<number> | undefined,
  registry: PageRegistry<Page>
): void {
  const initialSourceChanged = navigation ? fallbackPage !== registry.fallbackPage : initialPage !== registry.ids[registry.initialIndex];
  const registrationChanged =
    pageElements.length !== registry.ids.length ||
    initialSourceChanged ||
    pageElements.some(
      (page, index) =>
        page.props.id !== registry.ids[index] || Boolean(page.props.lazy ?? defaultLazy) !== Boolean(registry.lazyContent[index])
    );

  const gestureConfigurationChanged =
    enableSwipeToGoBack !== registry.supportsBackGesture ||
    enableSwipeToGoForward !== registry.forwardGestureMode ||
    navigation !== registry.navigation;

  if (registrationChanged || gestureConfigurationChanged || pageIndex !== registry.pageIndex) {
    throw new Error('SmoothPager configuration cannot change while mounted. Remount the pager to change it.');
  }
}

// ============ Lazy Content Lifecycle ========================================= //

function requestContentMount<Page extends string>(registry: PageRegistry<Page>, index: number): void {
  const content = registry.lazyContent[index];
  if (!content || content.mounted || content.mountRequested) return;

  content.mountRequested = true;
  registry.pendingContentMounts += 1;

  content.onMounted = () => {
    registry.pendingContentMounts -= 1;
    if (registry.pendingContentMounts !== 0) return;

    const afterContentMounts = registry.afterContentMounts;
    registry.afterContentMounts = undefined;
    afterContentMounts?.();
  };
  content.mount?.();
}

function runAfterContentMounts<Page extends string>(registry: PageRegistry<Page>, callback: () => void): void {
  registry.afterContentMounts = callback;

  if (registry.pendingContentMounts === 0) {
    registry.afterContentMounts = undefined;
    callback();
  }
}

function disableCompletedLazyLifecycle<Page extends string>(registry: PageRegistry<Page>): void {
  // Once all lazy content is mounted, settling no longer needs to notify React.
  if (registry.restState && registry.lazyContent.every(content => !content || content.mounted)) {
    registry.restState.value = PAGER_REST_DISABLED;
  }
}

// ============ Swipe Targets ================================================== //

function resolvePageIndex<Page extends string>(
  page: Page | undefined,
  fallbackIndex: number,
  activeIndex: number,
  registry: PageRegistry<Page>
): number {
  const index = page === undefined ? fallbackIndex : registry.indexById.get(page);
  return index === undefined || index < 0 || index >= registry.ids.length || index === activeIndex ? -1 : index;
}

function getGestureCandidates<Page extends string>(
  registry: PageRegistry<Page>,
  state: PagerNavigationState<Page>,
  activeIndex: number
): PagerGestureCandidates {
  const historyBackIndex = registry.supportsBackGesture ? resolvePageIndex(state.back, -1, activeIndex, registry) : -1;
  const declarationPreviousIndex = registry.supportsBackGesture ? resolvePageIndex(undefined, activeIndex - 1, activeIndex, registry) : -1;
  const canUseLinearForward =
    registry.forwardGestureMode === 'always' || (registry.furthestIndex !== undefined && activeIndex < registry.furthestIndex);

  const declarationNextIndex = canUseLinearForward ? resolvePageIndex(undefined, activeIndex + 1, activeIndex, registry) : -1;
  const historyForwardIndex = registry.forwardGestureMode !== false ? resolvePageIndex(state.forward, -1, activeIndex, registry) : -1;

  // Prefer the page the user came from; otherwise use an adjacent page before replaying forward history.
  return [historyBackIndex, declarationPreviousIndex, declarationNextIndex, historyForwardIndex];
}

function resolveReadyGestureTargets<Page extends string>(
  registry: PageRegistry<Page>,
  candidates: PagerGestureCandidates,
  activeIndex: number
): PagerGestureTargets {
  let leftIndex = -1;
  let rightIndex = -1;

  for (const index of candidates) {
    if (!isPageReady(registry, index)) continue;

    if (index < activeIndex && leftIndex === -1) leftIndex = index;
    else if (index > activeIndex && rightIndex === -1) rightIndex = index;

    if (leftIndex !== -1 && rightIndex !== -1) break;
  }

  return [leftIndex, rightIndex];
}

function getPreparationTargets<Page extends string>(
  registry: PageRegistry<Page>,
  activeIndex: number,
  candidates: PagerGestureCandidates
): number[] {
  const nextIndex = activeIndex + 1 < registry.ids.length ? activeIndex + 1 : -1;
  const indices = [nextIndex, ...candidates];
  return indices.filter((index, offset) => index !== -1 && indices.indexOf(index) === offset);
}

function isPageReady<Page extends string>(registry: PageRegistry<Page>, index: number): boolean {
  if (index === -1) return false;
  return registry.lazyContent[index]?.mounted ?? true;
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  fillHeight: {
    height: '100%',
  },
  layoutAnchor: {
    position: 'relative',
  },
  page: {
    alignItems: 'center',
    height: '100%',
    left: 0,
    position: 'absolute',
    top: 0,
    width: DEVICE_WIDTH,
  },
  pagerContainer: {
    flex: 1,
    width: DEVICE_WIDTH,
  },
});
