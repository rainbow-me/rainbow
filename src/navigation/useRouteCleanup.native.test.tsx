import React, { act } from 'react';

import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';
import { afterEach, expect, it, vi } from 'vitest';

import { useRouteCleanup } from './useRouteCleanup';

const { navigation, state } = vi.hoisted(() => {
  const state = { routes: [{ key: 'a', name: 'AddCashSheet' }] };
  return { navigation: { getState: () => state }, state };
});

vi.mock('@/navigation/Navigation', () => ({ useNavigation: () => navigation }));
vi.mock('@/navigation/RouteContext', () => ({
  useRoute: () => ({ key: 'screen', name: 'AddCashSheet' }),
}));

const renderer = await vi.importActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
const ROOT_TAG = 101;

function Screen({ cleanup }: { cleanup: () => void }) {
  useRouteCleanup(cleanup);
  return null;
}

function render(children: React.ReactNode): void {
  act(() => {
    renderer.render(<>{children}</>, ROOT_TAG, undefined, undefined);
  });
}

afterEach(() => {
  act(() => renderer.unmountComponentAtNode(ROOT_TAG));
});

it('preserves a replacement route, including when another screen covers it', () => {
  const cleanupA = vi.fn();
  const cleanupB = vi.fn();
  state.routes = [{ key: 'a', name: 'AddCashSheet' }];
  render(<Screen key="a" cleanup={cleanupA} />);

  state.routes = [
    { key: 'b', name: 'AddCashSheet' },
    { key: 'payment', name: 'CashPaymentMethodsSheet' },
  ];
  render([<Screen key="a" cleanup={cleanupA} />, <Screen key="b" cleanup={cleanupB} />]);
  render(<Screen key="b" cleanup={cleanupB} />);
  expect(cleanupA).not.toHaveBeenCalled();
  expect(cleanupB).not.toHaveBeenCalled();

  state.routes = [{ key: 'home', name: 'Stack' }];
  render(null);
  expect(cleanupB).toHaveBeenCalledTimes(1);
});

it('waits for unmount after route removal and invokes the latest callback', () => {
  const cleanup = vi.fn();
  state.routes = [{ key: 'a', name: 'AddCashSheet' }];
  render(<Screen cleanup={() => cleanup('initial')} />);

  state.routes = [{ key: 'home', name: 'Stack' }];
  render(<Screen cleanup={() => cleanup('latest')} />);
  expect(cleanup).not.toHaveBeenCalled();

  render(null);
  expect(cleanup).toHaveBeenCalledExactlyOnceWith('latest');
});
