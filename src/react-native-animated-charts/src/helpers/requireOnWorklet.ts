// TODO: Add proper typings here
// @ts-nocheck
import { useRef } from 'react';
import { useWorkletCallback } from 'react-native-reanimated';
import { d3Interpolate } from './d3Interpolate';

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

export function useWorkletValue() {
  const idRef = useRef<number>();

  if (!idRef.current) {
    // TODO: use some uuid here
    idRef.current = Date.now() + Math.floor(Math.random() * 10000);
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
