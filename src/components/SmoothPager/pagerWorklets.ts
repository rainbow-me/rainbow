import {
  cancelAnimation,
  runOnJS,
  withSpring,
  withTiming,
  type makeMutable,
  type SharedValue,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated';

// ============ Types ========================================================== //

export type PagerAnimation = { type: 'spring'; config: WithSpringConfig } | { type: 'timing'; config: WithTimingConfig };
export type PagerRestState = -1 | 0 | 1;
export type PagerSide = -1 | 1;

/** A page position whose current spring velocity can be carried into an interrupted transition. */
export type PagerPosition = MutablePosition & {
  readonly _animation?: (NonNullable<MutablePosition['_animation']> & { readonly velocity?: number }) | null;
};

/** Page indices available on the left and right; `-1` means no page is available on that side. */
export type PagerGestureTargets = readonly [leftIndex: number, rightIndex: number];

/**
 * Mutable gesture and transition state stored on the UI thread.
 * `gestureTarget`, `leftTarget`, and `rightTarget` store a page index plus one so that zero can mean “no page.”
 */
export type PagerGestureState = {
  readonly __workletContextObject: true;
  gestureOrigin: number;
  gestureTarget: number;
  gestureTrailingIndex: number;
  leftTarget: number;
  motionPeerIndex: number;
  rightTarget: number;
};

type AnimationCallback = (finished?: boolean) => void;
type MutablePosition = ReturnType<typeof makeMutable<number>>;
type PageSettledCallback = (index: number) => void;

// ============ Constants and Gesture State ==================================== //

export const PAGER_REST_DISABLED: PagerRestState = -1;
export const PAGER_REST_IDLE: PagerRestState = 0;
export const PAGER_REST_REQUESTED: PagerRestState = 1;
export const NO_PAGER_GESTURE_TARGETS: PagerGestureTargets = [-1, -1];

export function createPagerGestureState(): PagerGestureState {
  return {
    __workletContextObject: true,
    gestureOrigin: 0,
    gestureTarget: 0,
    gestureTrailingIndex: -1,
    leftTarget: 0,
    motionPeerIndex: -1,
    rightTarget: 0,
  };
}

// ============ Animation Coordinates ========================================== //

/** Reanimated produces smoother motion on device when page positions span this larger range. */
const SCALE_FACTOR = 200;

/** Converts an animated pager index back to page units. */
export function downscalePagerIndex(scaledIndex: number): number {
  'worklet';
  return scaledIndex / SCALE_FACTOR;
}

/** Converts a page index to the scaled value used for animation. */
export function upscalePagerIndex(index: number): number {
  'worklet';
  return index * SCALE_FACTOR;
}

// ============ Animation and Settlement ======================================= //

export function cancelPagerAnimations(positions: readonly PagerPosition[], pageIndex: SharedValue<number> | undefined): void {
  'worklet';
  for (const position of positions) cancelAnimation(position);
  if (pageIndex) cancelAnimation(pageIndex);
}

function animateValue(
  value: SharedValue<number>,
  destination: number,
  animation: PagerAnimation,
  velocity?: number,
  callback?: AnimationCallback
): void {
  'worklet';
  if (animation.type === 'spring') {
    const config = velocity === undefined ? animation.config : { ...animation.config, velocity };
    value.value = withSpring(destination, config, callback);
  } else {
    value.value = withTiming(destination, animation.config, callback);
  }
}

function getRestingPagePosition(pageIndex: number, activeIndex: number): number {
  'worklet';
  return pageIndex === activeIndex ? 0 : pageIndex < activeIndex ? -SCALE_FACTOR : SCALE_FACTOR;
}

function arePagerPagesSettled(positions: readonly PagerPosition[], activeIndex: number): boolean {
  'worklet';
  for (let index = 0; index < positions.length; index += 1) {
    if (positions[index].value !== getRestingPagePosition(index, activeIndex)) return false;
  }
  return true;
}

function completePagerRest(
  gestureState: PagerGestureState | undefined,
  restState: SharedValue<PagerRestState>,
  settledIndex: number,
  onSettled: PageSettledCallback
): void {
  'worklet';
  restState.value = PAGER_REST_IDLE;

  if (gestureState) {
    gestureState.leftTarget = 0;
    gestureState.rightTarget = 0;
  }
  runOnJS(onSettled)(settledIndex);
}

function settlePages(
  positions: readonly PagerPosition[],
  activeIndex: SharedValue<number>,
  gestureState: PagerGestureState | undefined,
  pageIndex: SharedValue<number> | undefined,
  restState: SharedValue<PagerRestState> | undefined,
  settledIndex: number,
  positionVelocity: number | undefined,
  pageIndexVelocity: number | undefined,
  animation: PagerAnimation,
  notifyWhenSettled: boolean,
  onSettled: PageSettledCallback | undefined
): void {
  'worklet';
  const tracksRest = restState !== undefined && restState.value !== PAGER_REST_DISABLED && onSettled !== undefined;
  const expectedMotionPeerIndex = gestureState?.motionPeerIndex ?? -1;
  const tracksMotion = expectedMotionPeerIndex !== -1;

  if (tracksRest) restState.value = notifyWhenSettled ? PAGER_REST_REQUESTED : PAGER_REST_IDLE;

  const transitionDistance = -positions[settledIndex].value;
  let animationCount = 0;

  const onAnimationComplete: AnimationCallback | undefined =
    tracksMotion || tracksRest
      ? finished => {
          if (!finished || activeIndex.value !== settledIndex || !arePagerPagesSettled(positions, settledIndex)) {
            return;
          }

          if (tracksMotion && gestureState?.motionPeerIndex === expectedMotionPeerIndex) {
            gestureState.motionPeerIndex = -1;
          }

          const isPageIndexStale = pageIndex && pageIndex.value !== upscalePagerIndex(settledIndex);
          const skipSettlement = !isPageIndexStale || !tracksRest || !restState || !onSettled || restState.value !== PAGER_REST_REQUESTED;
          if (skipSettlement) return;

          completePagerRest(gestureState, restState, settledIndex, onSettled);
        }
      : undefined;

  for (let index = 0; index < positions.length; index += 1) {
    const position = positions[index];
    const currentPosition = position.value;
    const restingPosition = getRestingPagePosition(index, settledIndex);

    let destination: number;
    let normalizeWhenFinished = false;

    if (index === settledIndex) {
      destination = 0;
    } else if (Math.abs(currentPosition) < SCALE_FACTOR) {
      destination = currentPosition + transitionDistance;
      normalizeWhenFinished = true;
    } else {
      // A fully hidden page can move to the side implied by its order without being seen.
      if (currentPosition !== restingPosition) position.value = restingPosition;
      continue;
    }

    if (currentPosition === destination) {
      // Self assignment cancels a spring that happens to be crossing its boundary.
      position.value = normalizeWhenFinished ? restingPosition : destination;
      continue;
    }

    animationCount += 1;
    if (animation.type === 'spring') cancelAnimation(position);

    animateValue(
      position,
      destination,
      animation,
      positionVelocity,
      normalizeWhenFinished
        ? finished => {
            if (finished) position.value = restingPosition;
            onAnimationComplete?.(finished);
          }
        : onAnimationComplete
    );
  }

  if (pageIndex) {
    const destination = upscalePagerIndex(settledIndex);
    if (pageIndex.value === destination) {
      pageIndex.value = destination;
    } else {
      animationCount += 1;
      if (animation.type === 'spring') cancelAnimation(pageIndex);
      animateValue(pageIndex, destination, animation, pageIndexVelocity, onAnimationComplete);
    }
  }

  if (animationCount === 0) {
    if (tracksMotion && gestureState?.motionPeerIndex === expectedMotionPeerIndex) gestureState.motionPeerIndex = -1;
    if (restState?.value === PAGER_REST_REQUESTED && onSettled) completePagerRest(gestureState, restState, settledIndex, onSettled);
  }
}

// ============ Page Transitions =============================================== //

function getVisualSourceIndex(positions: readonly PagerPosition[], preferredIndex: number): number {
  'worklet';
  let closestIndex = preferredIndex;
  let closestDistance = Math.abs(positions[preferredIndex].value);

  for (let index = 0; index < positions.length; index += 1) {
    const distance = Math.abs(positions[index].value);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }
  return closestIndex;
}

function placePagerTarget(positions: readonly PagerPosition[], sourceIndex: number, targetIndex: number, targetSide: PagerSide): void {
  'worklet';
  const target = positions[targetIndex];
  const targetIsVisible = Math.abs(target.value) < SCALE_FACTOR;
  const targetPosition = targetIsVisible ? target.value : positions[sourceIndex].value + targetSide * SCALE_FACTOR;

  // Place a hidden page on the correct side before it becomes a swipe target.
  // If another visible page already occupies that slot, a newer navigation request has replaced it.
  for (let index = 0; index < positions.length; index += 1) {
    if (index === sourceIndex || index === targetIndex) continue;
    const position = positions[index].value;

    if (Math.abs(position) >= SCALE_FACTOR || Math.abs(position - targetPosition) < SCALE_FACTOR / 2) {
      positions[index].value = getRestingPagePosition(index, targetIndex);
    }
  }

  if (!targetIsVisible) target.value = targetPosition;
}

function getPagerTargetSide(positions: readonly PagerPosition[], sourceIndex: number, targetIndex: number): PagerSide {
  'worklet';
  const targetPosition = positions[targetIndex].value;
  const delta = targetPosition - positions[sourceIndex].value;
  if (Math.abs(targetPosition) < SCALE_FACTOR && delta !== 0) return delta < 0 ? -1 : 1;

  return targetIndex < sourceIndex ? -1 : 1;
}

export function setPagerGestureTargets(
  activeIndex: SharedValue<number>,
  gestureState: PagerGestureState | undefined,
  expectedActiveIndex: number,
  targets: PagerGestureTargets
): void {
  'worklet';
  if (!gestureState || activeIndex.value !== expectedActiveIndex) return;

  gestureState.leftTarget = targets[0] + 1;
  gestureState.rightTarget = targets[1] + 1;
}

export function transitionToPage(
  positions: readonly PagerPosition[],
  activeIndex: SharedValue<number>,
  gestureState: PagerGestureState | undefined,
  pageIndex: SharedValue<number> | undefined,
  restState: SharedValue<PagerRestState> | undefined,
  targetIndex: number,
  nextTargets: PagerGestureTargets,
  animation: PagerAnimation,
  onSettled: PageSettledCallback | undefined
): void {
  'worklet';
  const semanticSourceIndex = activeIndex.value;
  const previousMotionPeerIndex = gestureState?.motionPeerIndex ?? -1;
  const visualSourceIndex = getVisualSourceIndex(positions, semanticSourceIndex);
  const targetSide = getPagerTargetSide(positions, visualSourceIndex, targetIndex);
  const sourcePosition = positions[visualSourceIndex].value;

  const positionVelocity = animation.type === 'spring' ? (positions[visualSourceIndex]._animation?.velocity ?? 0) : undefined;
  const sourceDestination = visualSourceIndex === targetIndex ? 0 : -targetSide * SCALE_FACTOR;
  const remainingSourceTravel = sourceDestination - sourcePosition;

  const pageIndexVelocity =
    pageIndex && positionVelocity !== undefined && remainingSourceTravel !== 0
      ? positionVelocity * ((upscalePagerIndex(targetIndex) - pageIndex.value) / remainingSourceTravel)
      : undefined;

  if (gestureState) gestureState.gestureTarget = 0;
  placePagerTarget(positions, visualSourceIndex, targetIndex, targetSide);
  activeIndex.value = targetIndex;

  if (gestureState) {
    // Track the two pages that are actually moving.
    // A quickly replaced destination may enter history without reaching the screen.
    let nextMotionPeerIndex = previousMotionPeerIndex === targetIndex ? -1 : previousMotionPeerIndex;
    if (semanticSourceIndex !== targetIndex) nextMotionPeerIndex = semanticSourceIndex;
    if (visualSourceIndex !== targetIndex) nextMotionPeerIndex = visualSourceIndex;
    gestureState.motionPeerIndex = nextMotionPeerIndex;
  }

  setPagerGestureTargets(activeIndex, gestureState, targetIndex, nextTargets);

  settlePages(
    positions,
    activeIndex,
    gestureState,
    pageIndex,
    restState,
    targetIndex,
    positionVelocity,
    pageIndexVelocity,
    animation,
    true,
    onSettled
  );
}

export function requestPagerRest(
  positions: readonly PagerPosition[],
  activeIndex: SharedValue<number>,
  gestureState: PagerGestureState | undefined,
  pageIndex: SharedValue<number> | undefined,
  restState: SharedValue<PagerRestState>,
  animation: PagerAnimation,
  onSettled: PageSettledCallback
): void {
  'worklet';
  if (restState.value === PAGER_REST_DISABLED) return;
  restState.value = PAGER_REST_REQUESTED;

  if (gestureState) {
    gestureState.leftTarget = 0;
    gestureState.rightTarget = 0;
  }

  if ((gestureState?.gestureTarget ?? 0) !== 0) return;

  const activePage = activeIndex.value;
  const restPage = getVisualSourceIndex(positions, activePage);

  transitionToPage(positions, activeIndex, gestureState, pageIndex, restState, restPage, NO_PAGER_GESTURE_TARGETS, animation, onSettled);
}

// ============ Swipe Gestures ================================================= //

function getPagerTargetIndex(target: number): number {
  'worklet';
  return target - 1;
}

export function beginPagerGesture(
  positions: readonly PagerPosition[],
  activeIndex: SharedValue<number>,
  gestureState: PagerGestureState,
  pageIndex: SharedValue<number> | undefined,
  targetSide: PagerSide
): void {
  'worklet';
  const activePageIndex = activeIndex.value;
  const motionPeer = gestureState.motionPeerIndex;
  const hasMotionPeer = motionPeer !== -1 && motionPeer !== activePageIndex;

  let usesMotionPair = false;
  let sourceIndex = activePageIndex;
  let targetIndex = getPagerTargetIndex(targetSide === -1 ? gestureState.leftTarget : gestureState.rightTarget);

  if (hasMotionPeer) {
    const activePosition = positions[activePageIndex].value;
    const peerPosition = positions[motionPeer].value;
    const peerIsTarget = (peerPosition - activePosition) * targetSide > 0;
    const peerIsVisualSource = Math.abs(peerPosition) < Math.abs(activePosition);

    if (peerIsTarget || peerIsVisualSource) {
      usesMotionPair = true;
      sourceIndex = peerIsTarget ? activePageIndex : motionPeer;
      targetIndex = peerIsTarget ? motionPeer : activePageIndex;
    }
  }

  if (targetIndex < 0 || targetIndex === sourceIndex) return;
  cancelPagerAnimations(positions, pageIndex);

  const sourcePosition = positions[sourceIndex];
  if (!usesMotionPair) placePagerTarget(positions, sourceIndex, targetIndex, targetSide);

  let trailingIndex = -1;
  let trailingDistance = SCALE_FACTOR;

  for (let index = 0; index < positions.length; index += 1) {
    if (index === sourceIndex || index === targetIndex) continue;
    const distance = Math.abs(positions[index].value);
    if (distance < trailingDistance) {
      trailingDistance = distance;
      trailingIndex = index;
    }
  }

  gestureState.gestureOrigin = sourcePosition.value;
  gestureState.gestureTarget = targetIndex + 1;
  gestureState.motionPeerIndex = sourceIndex;
  gestureState.gestureTrailingIndex = trailingIndex;
}

export function updatePagerGesture(
  positions: readonly PagerPosition[],
  gestureState: PagerGestureState,
  pageIndex: SharedValue<number> | undefined,
  targetSide: PagerSide,
  changeX: number,
  pageWidth: number
): void {
  'worklet';
  const encodedTarget = gestureState.gestureTarget;
  if (encodedTarget === 0) return;

  const sourceIndex = gestureState.motionPeerIndex;
  if (sourceIndex === -1) return;

  const targetIndex = encodedTarget - 1;
  const sourcePosition = positions[sourceIndex];
  const targetPosition = positions[targetIndex];
  const currentSourcePosition = sourcePosition.value;
  const origin = gestureState.gestureOrigin;
  const destination = -targetSide * SCALE_FACTOR;
  const lowerBound = Math.min(origin, 0, destination);
  const upperBound = Math.max(origin, 0, destination);
  const nextSourcePosition = Math.max(lowerBound, Math.min(upperBound, currentSourcePosition + (changeX / pageWidth) * SCALE_FACTOR));
  const appliedChange = nextSourcePosition - currentSourcePosition;

  sourcePosition.value = nextSourcePosition;
  targetPosition.value += appliedChange;

  if (gestureState.gestureTrailingIndex !== -1) positions[gestureState.gestureTrailingIndex].value += appliedChange;

  if (pageIndex) {
    const remainingTravel = destination - currentSourcePosition;
    if (remainingTravel !== 0) {
      pageIndex.value += (upscalePagerIndex(targetIndex) - pageIndex.value) * (appliedChange / remainingTravel);
    }
  }
}

export function shouldCommitPagerGesture(
  targetPosition: number,
  velocityX: number,
  targetSide: PagerSide,
  velocityThreshold: number
): boolean {
  'worklet';
  const velocityTowardsTarget = -velocityX * targetSide;
  const progress = 1 - Math.min(Math.abs(targetPosition) / SCALE_FACTOR, 1);
  return velocityTowardsTarget > velocityThreshold || (velocityTowardsTarget >= -velocityThreshold && progress >= 0.5);
}

export function finishPagerGesture(
  positions: readonly PagerPosition[],
  activeIndex: SharedValue<number>,
  gestureState: PagerGestureState,
  pageIndex: SharedValue<number> | undefined,
  restState: SharedValue<PagerRestState> | undefined,
  targetSide: PagerSide,
  commit: boolean,
  velocityX: number,
  pageWidth: number,
  animation: PagerAnimation,
  onSettled: PageSettledCallback | undefined
): number {
  'worklet';
  const encodedTarget = gestureState.gestureTarget;
  if (encodedTarget === 0) return -1;

  const sourceIndex = gestureState.motionPeerIndex;
  if (sourceIndex === -1) return -1;

  const targetIndex = encodedTarget - 1;
  const settledIndex = commit ? targetIndex : sourceIndex;
  const changesActivePage = settledIndex !== activeIndex.value;
  const scaledVelocity = (velocityX / pageWidth) * SCALE_FACTOR;
  const sourceDestination = commit ? -targetSide * SCALE_FACTOR : 0;
  const remainingSourceTravel = sourceDestination - positions[sourceIndex].value;
  const notifyWhenSettled =
    restState !== undefined && restState.value !== PAGER_REST_DISABLED && (commit || restState.value === PAGER_REST_REQUESTED);

  const pageIndexVelocity =
    pageIndex && remainingSourceTravel !== 0
      ? scaledVelocity * ((upscalePagerIndex(settledIndex) - pageIndex.value) / remainingSourceTravel)
      : undefined;

  activeIndex.value = settledIndex;
  gestureState.gestureTarget = 0;
  gestureState.motionPeerIndex = commit ? sourceIndex : targetIndex;
  gestureState.gestureTrailingIndex = -1;

  if (changesActivePage) {
    const availableSide = commit ? -targetSide : targetSide;
    const availableTarget = (commit ? sourceIndex : targetIndex) + 1;
    gestureState.leftTarget = availableSide === -1 ? availableTarget : 0;
    gestureState.rightTarget = availableSide === 1 ? availableTarget : 0;
  }

  settlePages(
    positions,
    activeIndex,
    gestureState,
    pageIndex,
    restState,
    settledIndex,
    scaledVelocity,
    pageIndexVelocity,
    animation,
    notifyWhenSettled,
    onSettled
  );

  return settledIndex;
}
