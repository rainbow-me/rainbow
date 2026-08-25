import type { RainbowConfig, RemoteConfigKey } from '../stores/remoteConfig';

export type MockedRemoteConfigValues = Partial<Pick<RainbowConfig, RemoteConfigKey>>;

let values: MockedRemoteConfigValues = {};

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown> | null | undefined)?.then === 'function';

export const mockedRemoteConfig = (): RainbowConfig => values as RainbowConfig;

export function setRemoteConfig(config: MockedRemoteConfigValues): void {
  values = { ...config };
}

export function withRemoteConfig<T>(config: MockedRemoteConfigValues, body: () => T): T {
  const previous = values;
  values = { ...previous, ...config };

  const restore = () => {
    values = previous;
  };

  let result: T;
  try {
    result = body();
  } catch (error) {
    restore();
    throw error;
  }

  if (isThenable(result)) return Promise.resolve(result).finally(restore) as T;
  restore();
  return result;
}
