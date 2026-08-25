import { getRemoteConfig, useRemoteConfig, useRemoteConfigStore } from '@/features/config/stores/remoteConfig';

import { setRemoteConfig, withRemoteConfig } from './mockRemoteConfig';

jest.mock('@/features/config/stores/remoteConfig');
setRemoteConfig({ nfts_enabled: true });

const nftsEnabled = () => getRemoteConfig().nfts_enabled;

describe('the remote config mock', () => {
  it('serves the config through every read the store exposes', () => {
    expect(getRemoteConfig().nfts_enabled).toBe(true);
    expect(useRemoteConfig().nfts_enabled).toBe(true);
    expect(useRemoteConfigStore.getState().getRemoteConfigKey('nfts_enabled')).toBe(true);
  });

  it('narrows to the requested keys', () => {
    expect(useRemoteConfig('nfts_enabled')).toEqual({ nfts_enabled: true });
  });

  it('reads undefined for keys that were not supplied', () => {
    expect(getRemoteConfig().perps_enabled).toBeUndefined();
  });

  it('rejects keys the config does not declare, and values of the wrong type', () => {
    withRemoteConfig(
      // @ts-expect-error 'nfts_enabld' is not a config key
      { nfts_enabld: true },
      () => undefined
    );
    // @ts-expect-error nfts_enabled is a boolean
    withRemoteConfig({ nfts_enabled: 'yes' }, () => undefined);

    expect(nftsEnabled()).toBe(true);
  });

  it('resolves reads on each call rather than snapshotting', () => {
    const { getRemoteConfigKey } = useRemoteConfigStore.getState();
    withRemoteConfig({ nfts_enabled: false }, () => {
      expect(getRemoteConfigKey('nfts_enabled')).toBe(false);
    });
  });
});

describe('withRemoteConfig', () => {
  it('applies the override inside the block and restores the previous config after it', () => {
    withRemoteConfig({ nfts_enabled: false }, () => {
      expect(nftsEnabled()).toBe(false);
    });
    expect(nftsEnabled()).toBe(true);
  });

  it('returns the block result', () => {
    expect(withRemoteConfig({ nfts_enabled: false }, () => 'value')).toBe('value');
  });

  it('restores when the block throws', () => {
    expect(() =>
      withRemoteConfig({ nfts_enabled: false }, () => {
        throw new Error('boom');
      })
    ).toThrow('boom');
    expect(nftsEnabled()).toBe(true);
  });

  it('restores only once an async block resolves', async () => {
    const pending = withRemoteConfig({ nfts_enabled: false }, async () => {
      await Promise.resolve();
      return nftsEnabled();
    });
    expect(nftsEnabled()).toBe(false);
    await expect(pending).resolves.toBe(false);
    expect(nftsEnabled()).toBe(true);
  });

  it('restores only once a thenable that is not a native Promise settles', async () => {
    const thenable = <T>(value: T): PromiseLike<T> => ({ then: onFulfilled => Promise.resolve(value).then(onFulfilled) });

    const pending = withRemoteConfig({ nfts_enabled: false }, () => thenable('done'));
    expect(nftsEnabled()).toBe(false);
    await expect(pending).resolves.toBe('done');
    expect(nftsEnabled()).toBe(true);
  });

  it('restores when an async block rejects', async () => {
    await expect(withRemoteConfig({ nfts_enabled: false }, () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(nftsEnabled()).toBe(true);
  });

  it('merges when nested and unwinds one level at a time', () => {
    withRemoteConfig({ nfts_enabled: false }, () => {
      withRemoteConfig({ perps_enabled: true }, () => {
        expect(nftsEnabled()).toBe(false);
        expect(getRemoteConfig().perps_enabled).toBe(true);
      });
      expect(nftsEnabled()).toBe(false);
      expect(getRemoteConfig().perps_enabled).toBeUndefined();
    });
    expect(nftsEnabled()).toBe(true);
  });
});
