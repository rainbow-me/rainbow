// TODO: Add proper typings here
// @ts-nocheck
import { useRef } from 'react';
import { useWorkletCallback } from 'react-native-reanimated';
import { d3Interpolate } from './d3Interpolate';

// cache for worklet modules
function requireOrAdd(name: string, module: any) {
  'worklet';

  if (!global.__reanimatedUIModulesMap) {
    global.__reanimatedUIModulesMap = {};
  }

  if (!global.__reanimatedUIModulesMap[name]) {
    global.__reanimatedUIModulesMap[name] = module();
  }

  return global.__reanimatedUIModulesMap[name];
}

/**
 * This is a workaround thing in order to actually require userland modules on worklet.
 * Reanimated currently doesn't support js npm modules on worklet runtime.
 * So in order to achieve it we copy minimized module's code and wrap it with worklet
 * (see d3Interpolate as an examole of that)
 * And here is some kind of require polyfill where we can actually import
 * these worklet modules.
 * The main reason here is that we do all the things directly on the worklet runtime.
 * So the library can be used as is on the worklet runtime without workletelizing
 * each and evey function and dealing with the stuff worklet runtime don't like.
 * It's just JS at that point. Just on different runtime.
 *
 * @param name - module name
 * @returns
 */

export function requireOnWorklet(name: 'd3-interpolate-path') {
  'worklet';

  // can be codegened
  switch (name) {
    case 'd3-interpolate-path':
      return requireOrAdd(name, d3Interpolate);
    default:
      throw new Error(`Cannot resolve UI module with a name ${name}`);
  }
}

let _id = Number.MIN_SAFE_INTEGER;

/**
 * This hooks returns a worklet. That worklet returns some kind of SharedValue.
 * The difference between shared values and this one - we can't use it outside of worklet.
 * What does it give us? It actually allows us to assign just anything to it.
 * Because this is just a regular js value on the worklet runtime.
 * There is already a thing reanimated to address it - remote value. But as for now
 * remote values are attached to the context of the individual worklet so we can't
 * share them between worklets. This is basically workaround.
 *
 * In this library, we currently have d3-interpolate-path module we would want to use
 * on the Worklet runtime. That module returns a complex JS Object which can't be "adopted"
 * by shared value (can't be copied from JS runtime and recreated properly on worklet runtime)
 * So we use requireOnWorklet to actually get that module on worklet rutime,
 * create its instance and store it inside that worklet value in order to use
 * in other worklets.
 *
 * @returns {Function} - function that returns object with getter and setter for value property
 */
export function useWorkletValue() {
  const idRef = useRef<number>();

  if (!idRef.current) {
    // TODO: use some uuid here
    idRef.current = `workletValue_${_id++}`;
  }

  const { current } = idRef;

  return useWorkletCallback(() => {
    'worklet';

    if (!global.remoteValues) {
      global.remoteValues = {};
    }

    return {
      get value() {
        return global.remoteValues[current];
      },
      set value(value) {
        global.remoteValues[current] = value;
      },
    };
  });
}
