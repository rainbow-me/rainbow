import { get, each } from 'lodash';
import expandedTransition from './expanded';
import sheetTransition, { sheetVerticalOffset } from './sheet';

export function buildTransitions(navigation, transitions) {
  return (transitionProps, prevTransitionProps) => {
    const nextEffect = get(transitionProps, 'scene.descriptor.options.effect');
    const prevEffect = get(prevTransitionProps, 'scene.descriptor.options.effect');

    let currentTransition = null;

    each(transitions, (transition, key) => {
      if (nextEffect === key || prevEffect === key) {
        currentTransition = transition;
      }
    });

    if (typeof currentTransition === 'function') {
      return currentTransition(navigation, transitionProps, prevTransitionProps);
    }

    return {};
  };
}

export const expanded = expandedTransition;
export const sheet = sheetTransition;

export default {
  buildTransitions,
  expanded,
  sheet,
  sheetVerticalOffset,
};
