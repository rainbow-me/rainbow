import { useEffect, useRef, useCallback } from 'react';

import WorkletEventHandler from './WorkletEventHandler';
import {
  startMapper,
  stopMapper,
  makeMutable,
  makeRemote,
  requestFrame,
} from './core';
import updateProps from './UpdateProps';
import { initialUpdaterRun } from './animations';
import { getTag } from './NativeMethods';
import NativeReanimated from './NativeReanimated';
import { Platform } from 'react-native';

export function useSharedValue(init, shouldRebuild = true) {
  const ref = useRef(null);
  if (ref.current === null) {
    ref.current = {
      mutable: makeMutable(init),
      last: init,
    };
  } else if (init !== ref.current.last && shouldRebuild) {
    ref.current.last = init;
    ref.current.mutable.value = init;
  }

  return ref.current.mutable;
}

export function useMapper(fun, inputs = [], outputs = [], dependencies = []) {
  useEffect(() => {
    const mapperId = startMapper(fun, inputs, outputs);
    return () => {
      stopMapper(mapperId);
    };
  }, dependencies);
}

export function useEvent(handler, eventNames = [], rebuild = false) {
  const initRef = useRef(null);
  if (initRef.current === null || (Platform.OS === 'web' && rebuild)) {
    initRef.current = new WorkletEventHandler(handler, eventNames);
  } else if (rebuild) {
    initRef.current.updateWorklet(handler);
  }
  return initRef.current;
}

function prepareAnimation(animatedProp, lastAnimation, lastValue) {
  'worklet';
  function prepareAnimation(animatedProp, lastAnimation, lastValue) {
    if (Array.isArray(animatedProp)) {
      animatedProp.forEach((prop, index) =>
        prepareAnimation(
          prop,
          lastAnimation && lastAnimation[index],
          lastValue && lastValue[index]
        )
      );
      return animatedProp;
    }
    if (typeof animatedProp === 'object' && animatedProp.onFrame) {
      const animation = animatedProp;

      let value = animation.current;
      if (lastValue !== undefined) {
        if (typeof lastValue === 'object') {
          if (lastValue.value !== undefined) {
            // previously it was a shared value
            value = lastValue.value;
          } else if (lastValue.onFrame !== undefined) {
            // it was an animation before, copy its state
            value = lastAnimation.current;
          }
        } else {
          // previously it was a plan value, just set it as starting point
          value = lastValue;
        }
      }

      animation.callStart = (timestamp) => {
        animation.onStart(animation, value, timestamp, lastAnimation);
      };
    } else if (typeof animatedProp === 'object') {
      // it is an object
      Object.keys(animatedProp).forEach((key) =>
        prepareAnimation(
          animatedProp[key],
          lastAnimation && lastAnimation[key],
          lastValue && lastValue[key]
        )
      );
    }
  }
  return prepareAnimation(animatedProp, lastAnimation, lastValue);
}

function runAnimations(animation, timestamp, key, result) {
  'worklet';
  function runAnimations(animation, timestamp, key, result) {
    if (Array.isArray(animation)) {
      result[key] = [];
      let allFinished = true;
      animation.forEach((entry, index) => {
        if (!runAnimations(entry, timestamp, index, result[key])) {
          allFinished = false;
        }
      });
      return allFinished;
    } else if (typeof animation === 'object' && animation.onFrame) {
      if (animation.callStart) {
        animation.callStart(timestamp);
        animation.callStart = null;
      }
      const finished = animation.onFrame(animation, timestamp);
      animation.timestamp = timestamp;
      if (finished) {
        animation.finished = true;
        animation.callback && animation.callback(true /* finished */);
      }
      result[key] = animation.current;
      return finished;
    } else if (typeof animation === 'object') {
      result[key] = {};
      let allFinished = true;
      Object.keys(animation).forEach((k) => {
        if (!runAnimations(animation[k], timestamp, k, result[key])) {
          allFinished = false;
        }
      });
      return allFinished;
    } else {
      result[key] = animation;
      return true;
    }
  }
  return runAnimations(animation, timestamp, key, result);
}

// TODO: recirsive worklets aren't supported yet
function isAnimated(prop) {
  'worklet';
  function isAnimated(prop) {
    if (Array.isArray(prop)) {
      return prop.some(isAnimated);
    }
    if (typeof prop === 'object') {
      if (prop.onFrame) {
        return true;
      }
      return Object.keys(prop).some((key) => isAnimated(prop[key]));
    }
    return false;
  }
  return isAnimated(prop);
}

function styleDiff(oldStyle, newStyle) {
  'worklet';
  const diff = {};
  Object.keys(oldStyle).forEach((key) => {
    if (newStyle[key] === undefined) {
      diff[key] = null;
    }
  });
  Object.keys(newStyle).forEach((key) => {
    const value = newStyle[key];
    const oldValue = oldStyle[key];

    if (isAnimated(value)) {
      // do nothing
      return;
    }
    if (
      oldValue !== value &&
      JSON.stringify(oldValue) !== JSON.stringify(value)
    ) {
      // I'd use deep equal here but that'd take additional work and this was easier
      diff[key] = value;
    }
  });
  return diff;
}

function styleUpdater(viewTag, updater, state, maybeViewRef) {
  'worklet';
  const animations = state.animations || {};
  const newValues = updater() || {};
  const oldValues = state.last;

  // extract animated props
  let hasAnimations = false;
  Object.keys(animations).forEach((key) => {
    const value = newValues[key];
    if (!isAnimated(value)) {
      delete animations[key];
    }
  });
  Object.keys(newValues).forEach((key) => {
    const value = newValues[key];
    if (isAnimated(value)) {
      prepareAnimation(value, animations[key], oldValues[key]);
      animations[key] = value;
      hasAnimations = true;
    }
  });

  function frame(timestamp) {
    const { animations, last, isAnimationCancelled } = state;
    if (isAnimationCancelled) {
      state.isAnimationRunning = false;
      return;
    }

    const updates = {};
    let allFinished = true;
    Object.keys(animations).forEach((propName) => {
      const finished = runAnimations(
        animations[propName],
        timestamp,
        propName,
        updates
      );
      if (finished) {
        last[propName] = updates[propName];
        delete animations[propName];
      } else {
        allFinished = false;
      }
    });

    if (Object.keys(updates).length) {
      updateProps(viewTag.value, updates, maybeViewRef);
    }

    if (!allFinished) {
      requestFrame(frame);
    } else {
      state.isAnimationRunning = false;
    }
  }

  if (hasAnimations) {
    state.animations = animations;
    if (!state.isAnimationRunning) {
      state.isAnimationCancelled = false;
      state.isAnimationRunning = true;
      requestFrame(frame);
    }
  } else {
    state.isAnimationCancelled = true;
    state.animations = {};
  }

  // calculate diff
  const diff = styleDiff(oldValues, newValues);
  state.last = Object.assign({}, oldValues, newValues);

  if (Object.keys(diff).length !== 0) {
    updateProps(viewTag.value, diff, maybeViewRef);
  }
}

export function useAnimatedStyle(updater, dependencies) {
  const viewTag = useSharedValue(-1);
  const initRef = useRef(null);
  const inputs = Object.values(updater._closure);
  const viewRef = useRef(null);

  // build dependencies
  if (dependencies === undefined) {
    dependencies = [...inputs, updater.__workletHash];
  } else {
    dependencies.push(updater.__workletHash);
  }

  if (initRef.current === null) {
    const initial = initialUpdaterRun(updater);
    initRef.current = {
      initial,
      remoteState: makeRemote({ last: initial }),
    };
  }

  const { remoteState, initial } = initRef.current;
  const maybeViewRef = NativeReanimated.native ? undefined : viewRef;

  useEffect(() => {
    const fun = () => {
      'worklet';
      styleUpdater(viewTag, updater, remoteState, maybeViewRef);
    };
    const mapperId = startMapper(fun, inputs, []);
    return () => {
      stopMapper(mapperId);
    };
  }, dependencies);

  // check for invalid usage of shared values in returned object
  let wrongKey;
  const isError = Object.keys(initial).some((key) => {
    const element = initial[key];
    const result = typeof element === 'object' && element.value !== undefined;
    if (result) {
      wrongKey = key;
    }
    return result;
  });
  if (isError && wrongKey !== undefined) {
    throw new Error(
      `invalid value passed to \`${wrongKey}\`, maybe you forgot to use \`.value\`?`
    );
  }

  return {
    viewTag,
    initial,
    viewRef,
  };
}

// TODO: we should make sure that when useAP is used we are not assigning styles
// when you need styles to animated you should always use useAS
export const useAnimatedProps = useAnimatedStyle;

export function useDerivedValue(processor, dependencies) {
  const initRef = useRef(null);
  const inputs = Object.values(processor._closure);

  // build dependencies
  if (dependencies === undefined) {
    dependencies = [...inputs, processor.__workletHash];
  } else {
    dependencies.push(processor.__workletHash);
  }

  if (initRef.current === null) {
    initRef.current = makeMutable(initialUpdaterRun(processor));
  }

  const sharedValue = initRef.current;

  useEffect(() => {
    const fun = () => {
      'worklet';
      sharedValue.value = processor();
    };
    const mapperId = startMapper(fun, inputs, [sharedValue]);
    return () => {
      stopMapper(mapperId);
    };
  }, dependencies);

  return sharedValue;
}

// builds one big hash from multiple worklets' hashes
function buildWorkletsHash(handlers) {
  return Object.keys(handlers).reduce(
    (previousValue, key) =>
      previousValue === null
        ? handlers[key].__workletHash
        : previousValue.toString() + handlers[key].__workletHash.toString(),
    null
  );
}

// builds dependencies array for gesture handlers
function buildDependencies(dependencies, handlers) {
  if (dependencies === undefined) {
    dependencies = Object.keys(handlers).map((handlerKey) => {
      const handler = handlers[handlerKey];
      return {
        workletHash: handler.__workletHash,
        closure: handler._closure,
      };
    });
  } else {
    dependencies.push(buildWorkletsHash(handlers));
  }
  return dependencies;
}

// this is supposed to work as useEffect comparison
function areDependenciesEqual(nextDeps, prevDeps) {
  function is(x, y) {
    /* eslint-disable no-self-compare */
    return (x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y);
    /* eslint-enable no-self-compare */
  }
  var objectIs = typeof Object.is === 'function' ? Object.is : is;

  function areHookInputsEqual(nextDeps, prevDeps) {
    if (prevDeps === null) return !1;
    for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++)
      if (!objectIs(nextDeps[i], prevDeps[i])) return !1;
    return !0;
  }

  return areHookInputsEqual(nextDeps, prevDeps);
}

export function useAnimatedGestureHandler(handlers, dependencies) {
  const initRef = useRef(null);
  if (initRef.current === null) {
    initRef.current = {
      context: makeRemote({}),
      savedDependencies: [],
    };
  }
  const { context, savedDependencies } = initRef.current;

  dependencies = buildDependencies(dependencies, handlers);

  const dependenciesDiffer = !areDependenciesEqual(
    dependencies,
    savedDependencies
  );
  initRef.current.savedDependencies = dependencies;

  return useEvent(
    (event) => {
      'worklet';
      const FAILED = 1;
      const BEGAN = 2;
      const CANCELLED = 3;
      const ACTIVE = 4;
      const END = 5;

      if (event.state === BEGAN && handlers.onStart) {
        handlers.onStart(event, context);
      }
      if (event.state === ACTIVE && handlers.onActive) {
        handlers.onActive(event, context);
      }
      if (event.oldState === ACTIVE && event.state === END && handlers.onEnd) {
        handlers.onEnd(event, context);
      }
      if (
        event.oldState === BEGAN &&
        event.state === FAILED &&
        handlers.onFail
      ) {
        handlers.onFail(event, context);
      }
      if (
        event.oldState === ACTIVE &&
        event.state === CANCELLED &&
        handlers.onCancel
      ) {
        handlers.onCancel(event, context);
      }
      if (
        (event.oldState === BEGAN || event.oldState === ACTIVE) &&
        event.state !== BEGAN &&
        event.state !== ACTIVE &&
        handlers.onFinish
      ) {
        handlers.onFinish(
          event,
          context,
          event.state === CANCELLED || event.state === FAILED
        );
      }
    },
    ['onGestureHandlerStateChange', 'onGestureHandlerEvent'],
    dependenciesDiffer
  );
}

export function useAnimatedScrollHandler(handlers, dependencies) {
  const initRef = useRef(null);
  if (initRef.current === null) {
    initRef.current = {
      context: makeRemote({}),
      savedDependencies: [],
    };
  }
  const { context, savedDependencies } = initRef.current;

  dependencies = buildDependencies(dependencies, handlers);

  const dependenciesDiffer = !areDependenciesEqual(
    dependencies,
    savedDependencies
  );
  initRef.current.savedDependencies = dependencies;

  // build event subscription array
  const subscribeForEvents = ['onScroll'];
  if (handlers.onBeginDrag !== undefined) {
    subscribeForEvents.push('onScrollBeginDrag');
  }
  if (handlers.onEndDrag !== undefined) {
    subscribeForEvents.push('onScrollEndDrag');
  }
  if (handlers.onMomentumBegin !== undefined) {
    subscribeForEvents.push('onMomentumScrollBegin');
  }
  if (handlers.onMomentumEnd !== undefined) {
    subscribeForEvents.push('onMomentumScrollEnd');
  }

  return useEvent(
    (event) => {
      'worklet';
      const {
        onScroll,
        onBeginDrag,
        onEndDrag,
        onMomentumBegin,
        onMomentumEnd,
      } = handlers;
      if (event.eventName.endsWith('onScroll')) {
        if (onScroll) {
          onScroll(event, context);
        } else if (typeof handlers === 'function') {
          handlers(event, context);
        }
      } else if (onBeginDrag && event.eventName.endsWith('onScrollBeginDrag')) {
        onBeginDrag(event, context);
      } else if (onEndDrag && event.eventName.endsWith('onScrollEndDrag')) {
        onEndDrag(event, context);
      } else if (
        onMomentumBegin &&
        event.eventName.endsWith('onMomentumScrollBegin')
      ) {
        onMomentumBegin(event, context);
      } else if (
        onMomentumEnd &&
        event.eventName.endsWith('onMomentumScrollEnd')
      ) {
        onMomentumEnd(event, context);
      }
    },
    subscribeForEvents,
    dependenciesDiffer
  );
}

export function useAnimatedRef() {
  const tag = useSharedValue(-1);
  const ref = useRef(null);

  if (!ref.current) {
    const fun = function(component) {
      'worklet';
      // enters when ref is set by attaching to a component
      if (component) {
        tag.value = getTag(component);
        fun.current = component;
      }
      return tag.value;
    };

    Object.defineProperty(fun, 'current', {
      value: null,
      writable: true,
      enumerable: false,
    });
    ref.current = fun;
  }

  return ref.current;
}

/**
 * @param prepare - worklet used for data preparation for the second parameter
 * @param react - worklet which takes data prepared by the one in the first parameter and performs certain actions
 * the first worklet defines the inputs, in other words on which shared values change will it be called.
 * the second one can modify any shared values but those which are mentioned in the first worklet. Beware of that, because this may result in endless loop and high cpu usage.
 */
export function useAnimatedReaction(prepare, react, dependencies) {
  const inputsRef = useRef(null);
  if (inputsRef.current === null) {
    inputsRef.current = {
      inputs: Object.values(prepare._closure),
    };
  }
  const { inputs } = inputsRef.current;

  if (dependencies === undefined) {
    dependencies = [
      Object.values(prepare._closure),
      Object.values(react._closure),
      prepare.__workletHash,
      react.__workletHash,
    ];
  } else {
    dependencies.push(prepare.__workletHash, react.__workletHash);
  }

  useEffect(() => {
    const fun = () => {
      'worklet';
      const input = prepare();
      react(input);
    };
    const mapperId = startMapper(fun, inputs, []);
    return () => {
      stopMapper(mapperId);
    };
  }, dependencies);
}

export function useWorkletCallback(fun, deps) {
  return useCallback(fun, deps);
}

export function createWorklet(fun) {
  return fun;
}
