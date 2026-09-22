import React, { act, type ReactNode } from 'react';

import { tabReselectEvents, useOnTabReselect } from '@/navigation/tabEvents';

const renderer = jest.requireActual<{
  render: (element: ReactNode, containerTag: number) => void;
  unmountComponentAtNode: (containerTag: number) => void;
}>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');

let mockRouteKey = 'sports';

jest.mock('@/navigation/RouteContext', () => ({ useRoute: () => ({ key: mockRouteKey }) }));

function Screen({ onReselect }: { onReselect: () => void }): null {
  useOnTabReselect(onReselect);
  return null;
}

beforeEach(() => {
  mockRouteKey = 'sports';
});

afterEach(() => {
  act(() => renderer.unmountComponentAtNode(105));
  jest.restoreAllMocks();
});

it('dispatches synchronously to the matching route key', () => {
  const onReselect = jest.fn();
  act(() => renderer.render(<Screen onReselect={onReselect} />, 105));

  tabReselectEvents.emit('wallet');
  tabReselectEvents.emit('sports-sheet');
  expect(onReselect).not.toHaveBeenCalled();

  tabReselectEvents.emit('sports');
  expect(onReselect).toHaveBeenCalledTimes(1);
});

it('uses the latest callback without replacing its subscription', () => {
  const subscribe = jest.spyOn(tabReselectEvents, 'on');
  const first = jest.fn();
  const latest = jest.fn();

  act(() => renderer.render(<Screen onReselect={first} />, 105));
  act(() => renderer.render(<Screen onReselect={latest} />, 105));
  tabReselectEvents.emit('sports');

  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledTimes(1);
  expect(subscribe).toHaveBeenCalledTimes(1);
});

it('moves the subscription when the route key changes', () => {
  const onReselect = jest.fn();
  act(() => renderer.render(<Screen onReselect={onReselect} />, 105));

  mockRouteKey = 'sports-new-instance';
  act(() => renderer.render(<Screen onReselect={onReselect} />, 105));
  tabReselectEvents.emit('sports');
  expect(onReselect).not.toHaveBeenCalled();

  tabReselectEvents.emit('sports-new-instance');
  expect(onReselect).toHaveBeenCalledTimes(1);
});

it('removes the listener on unmount and does not duplicate it after remounting', () => {
  const onReselect = jest.fn();
  act(() => renderer.render(<Screen onReselect={onReselect} />, 105));
  act(() => renderer.unmountComponentAtNode(105));
  tabReselectEvents.emit('sports');
  expect(onReselect).not.toHaveBeenCalled();

  act(() => renderer.render(<Screen onReselect={onReselect} />, 105));
  tabReselectEvents.emit('sports');
  expect(onReselect).toHaveBeenCalledTimes(1);
});
