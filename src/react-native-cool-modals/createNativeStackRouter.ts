import { StackActions, StackRouter } from '@react-navigation/native';

import { type NativeStackRoute, type NativeStackState } from './types';

type Router = ReturnType<typeof StackRouter>;
type NativeAction = ({ type: 'NATIVE_DISMISS' } | { type: 'NATIVE_RESTORE' }) & {
  source: string;
  target: string;
  payload: { presentationRequest: number };
};

/** Keeps a new presentation request distinct from dismissal of the same route. */
export function createNativeStackRouter(options: Parameters<typeof StackRouter>[0]) {
  const router = StackRouter(options);
  let nextRequest = 0;

  function requestRoute(route: NativeStackRoute): NativeStackRoute {
    nextRequest += 1;
    return { ...route, presentationRequest: nextRequest };
  }

  function requestPresentation(state: NativeStackState, index?: number): NativeStackState {
    if (index === undefined) return { ...state, routes: state.routes.map(requestRoute) };
    const routes = state.routes.slice();
    routes[index] = requestRoute(routes[index]);
    return { ...state, routes };
  }

  return {
    ...router,
    getInitialState(options: Parameters<Router['getInitialState']>[0]) {
      return requestPresentation(router.getInitialState(options));
    },
    getRehydratedState(partialState: Parameters<Router['getRehydratedState']>[0], options: Parameters<Router['getRehydratedState']>[1]) {
      const state: NativeStackState = router.getRehydratedState(partialState, options);
      for (const route of state.routes) {
        nextRequest = Math.max(nextRequest, route.presentationRequest ?? 0);
      }
      return partialState.stale === false ? state : requestPresentation(state);
    },
    getStateForRouteFocus(state: NativeStackState, key: string) {
      const next = router.getStateForRouteFocus(state, key);
      return next.routes[next.index].key === key ? requestPresentation(next, next.index) : next;
    },
    getStateForAction(
      state: NativeStackState,
      action: Parameters<Router['getStateForAction']>[1] | NativeAction,
      options: Parameters<Router['getStateForAction']>[2]
    ): ReturnType<Router['getStateForAction']> {
      if (action.type === 'NATIVE_DISMISS' || action.type === 'NATIVE_RESTORE') {
        const index = state.routes.findIndex(route => route.key === action.source);
        if (index === -1 || (state.routes[index].presentationRequest ?? 0) !== action.payload.presentationRequest) return state;
        return action.type === 'NATIVE_RESTORE'
          ? requestPresentation(state, index)
          : router.getStateForAction(state, { ...StackActions.pop(), source: action.source, target: state.key }, options);
      }

      const top = state.routes[state.index];
      const repeatedPush = action.type === 'PUSH' && top.name === action.payload.name;
      const next = repeatedPush ? state : router.getStateForAction(state, action, options);
      if (!next || next.stale !== false) return next;
      if (action.type === 'RESET') return requestPresentation(next);
      if (action.type !== 'NAVIGATE' && action.type !== 'PUSH' && action.type !== 'REPLACE') return next;
      return requestPresentation(next, next.index);
    },
  };
}
