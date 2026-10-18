import { CommonActions, StackActions } from '@react-navigation/native';
import { describe, expect, it, vi } from 'vitest';

import { createNativeStackRouter } from './createNativeStackRouter';

vi.mock('@react-navigation/native', () => vi.importActual('@react-navigation/routers'));

const options = { routeNames: ['Home', 'Settings', 'Activity'], routeParamList: {}, routeGetIdList: {} };
const router = createNativeStackRouter({ initialRouteName: 'Home' });
type State = Parameters<typeof router.getStateForAction>[0];

function apply(state: State, action: Parameters<typeof router.getStateForAction>[1], targetRouter = router): State {
  const next = targetRouter.getStateForAction(state, action, options);
  if (!next || next.stale !== false) throw new Error(`Action ${action.type} did not produce a ready state`);
  return next;
}

function open() {
  return apply(router.getInitialState(options), CommonActions.navigate('Settings', { page: 'first' }));
}

function dismissal(state: State, index = state.index) {
  const route = state.routes[index];
  return {
    type: 'NATIVE_DISMISS' as const,
    source: route.key,
    target: state.key,
    payload: { presentationRequest: route.presentationRequest ?? 0 },
  };
}

describe('native sheet presentation requests', () => {
  it('retains the same route and new params when its old dismissal arrives', () => {
    const initial = open();
    const oldDismissal = dismissal(initial);
    const reopened = apply(initial, CommonActions.navigate('Settings', { page: 'new' }));
    const settled = apply(reopened, oldDismissal);
    expect(settled.routes[1]).toMatchObject({ key: initial.routes[1].key, params: { page: 'new' } });
    expect(apply(settled, dismissal(settled)).routes.map(route => route.name)).toEqual(['Home']);
  });

  it('preserves a newer sheet when an older sheet finishes dismissing', () => {
    const initial = open();
    const next = apply(initial, CommonActions.navigate('Activity'));
    expect(apply(next, dismissal(initial)).routes.map(route => route.name)).toEqual(['Home', 'Activity']);
  });

  it('keeps a parent sheet requested through its child navigator', () => {
    const initial = open();
    const focused = router.getStateForRouteFocus(initial, initial.routes[1].key);
    expect(apply(focused, dismissal(initial)).routes[1].key).toBe(initial.routes[1].key);
  });

  it('treats a duplicate push as reopening without changing its route or params', () => {
    const initial = open();
    const requested = apply(initial, StackActions.push('Settings', { page: 'ignored' }));
    const settled = apply(requested, dismissal(initial));
    expect(settled.routes).toHaveLength(2);
    expect(settled.routes[1]).toMatchObject({ key: initial.routes[1].key, params: { page: 'first' } });
  });

  it('renews same-key RESET routes before admitting an old completion', () => {
    const initial = open();
    const reset = apply(initial, CommonActions.reset(initial));
    expect(reset.routes[1].presentationRequest).toBeGreaterThan(initial.routes[1].presentationRequest ?? 0);
    expect(apply(reset, dismissal(initial)).routes).toHaveLength(2);
  });

  it('advances the request sequence past fully rehydrated state', () => {
    const restoredRouter = createNativeStackRouter({ initialRouteName: 'Home' });
    const initial = open();
    const restored = restoredRouter.getRehydratedState(initial, options);
    const reopened = apply(restored, CommonActions.navigate('Settings'), restoredRouter);
    const settled = apply(reopened, dismissal(initial), restoredRouter);
    expect(settled.routes).toHaveLength(2);
    expect(settled.routes[1].presentationRequest).toBeGreaterThan(initial.routes[1].presentationRequest ?? 0);
  });

  it('only restores the current native request after a removal veto', () => {
    const initial = open();
    const restore = { ...dismissal(initial), type: 'NATIVE_RESTORE' as const };
    const reopened = apply(initial, restore);
    expect(reopened.routes[1].presentationRequest).toBeGreaterThan(initial.routes[1].presentationRequest ?? 0);
    expect(apply(reopened, restore)).toBe(reopened);
  });
});
