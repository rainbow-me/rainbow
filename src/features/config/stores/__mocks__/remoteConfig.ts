import { vi } from 'vitest';

import { mockedRemoteConfig } from '../../testing/mockRemoteConfig';
import type { RemoteConfigKey, RemoteConfigState } from '../remoteConfig';

const state = (): RemoteConfigState => ({
  config: mockedRemoteConfig(),
  lastFetchedVersion: 0,
  getRemoteConfigKey: key => mockedRemoteConfig()[key],
});

export const getRemoteConfig = mockedRemoteConfig;

export const useRemoteConfig = (...keys: RemoteConfigKey[]) =>
  keys.length ? Object.fromEntries(keys.map(key => [key, mockedRemoteConfig()[key]])) : mockedRemoteConfig();

export const useRemoteConfigStore = Object.assign(
  vi.fn((selector?: (state: RemoteConfigState) => unknown) => (selector ? selector(state()) : state())),
  { getState: state, subscribe: vi.fn(() => () => undefined) }
);

export const initializeRemoteConfig = async (): Promise<void> => undefined;

export const useRemoteConfigUpdates = (): void => undefined;
