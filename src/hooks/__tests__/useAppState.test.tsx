import React from 'react';
import { render, act } from '@testing-library/react-native';
import { AppState, AppStateStatus } from 'react-native';

import useAppState from '@/hooks/useAppState';

type AppStateEventHandler = (state: AppStateStatus) => void;

/**
 * Class mock is defined inline so that it is also hoisted to top of this scope
 * by Jest
 */
jest.mock('react-native', () => ({
  AppState: new (class MockAppState {
    events: AppStateEventHandler[] = [];
    currentState: AppStateStatus = 'unknown';

    addEventListener(_: string, cb: AppStateEventHandler) {
      this.events.push(cb);
      return {
        remove: () => {
          this.events.splice(this.events.indexOf(cb), 1);
        },
      };
    }

    setCurrentState(state: AppStateStatus) {
      this.currentState = state;
      this.events.forEach(cb => cb(this.currentState));
    }
  })(),
}));

/**
 * Just fixes type errors for us in this file
 */
const ProxyAppState = AppState as typeof AppState & {
  setCurrentState(state: AppStateStatus): void;
};

/**
 * Be sure to reset to the initial app state value
 */
beforeEach(() => {
  ProxyAppState.setCurrentState('unknown');
});

test('returns correct values', () => {
  const spy = jest.spyOn(ProxyAppState, 'addEventListener');
  const reporter = jest.fn();

  function Comp() {
    const { appState, justBecameActive } = useAppState();
    reporter({ appState, justBecameActive });
    return null;
  }

  const app = render(<Comp />);

  expect(spy).toHaveBeenCalled();
  expect(reporter).toHaveBeenCalledWith({
    appState: 'unknown',
    justBecameActive: false,
  });

  act(() => {
    ProxyAppState.setCurrentState('active');
  });

  app.rerender(<Comp />);

  expect(reporter).toHaveBeenCalledWith({
    appState: 'active',
    justBecameActive: true,
  });
});

test('runs callbacks', () => {
  const onChange = jest.fn();
  const onActive = jest.fn();
  const onBackground = jest.fn();

  function Comp() {
    useAppState({
      onChange,
      onActive,
      onBackground,
    });
    return null;
  }

  render(<Comp />);

  act(() => {
    ProxyAppState.setCurrentState('active');
  });

  expect(onChange).toHaveBeenCalledWith('active');
  expect(onActive).toHaveBeenCalled();

  act(() => {
    ProxyAppState.setCurrentState('background');
  });

  expect(onChange).toHaveBeenCalledWith('background');
  expect(onBackground).toHaveBeenCalled();
});

test('does not run callbacks more than needed', () => {
  const onChange = jest.fn();
  const onActive = jest.fn();
  const onBackground = jest.fn();

  function Comp() {
    useAppState({
      onChange,
      onActive,
      onBackground,
    });
    return null;
  }

  render(<Comp />);

  act(() => {
    ProxyAppState.setCurrentState('active');
  });

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onActive).toHaveBeenCalledTimes(1);

  act(() => {
    ProxyAppState.setCurrentState('active');
  });

  // still just one call
  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onActive).toHaveBeenCalledTimes(1);

  act(() => {
    ProxyAppState.setCurrentState('background');
  });

  // 2 calls now
  expect(onChange).toHaveBeenCalledTimes(2);
  expect(onBackground).toHaveBeenCalledTimes(1);

  act(() => {
    ProxyAppState.setCurrentState('background');
  });

  // still 2 calls
  expect(onChange).toHaveBeenCalledTimes(2);
  // still just one call
  expect(onBackground).toHaveBeenCalledTimes(1);
});
