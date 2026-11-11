import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOptimisticUpdater, type OptimisticUpdate } from './createOptimisticUpdater';

type TestData = Record<string, number>;
type TestUpdate = OptimisticUpdate<TestData, string>;

describe('createOptimisticUpdater', () => {
  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('merges tracked updates over backend data until backend data should no longer be ignored', () => {
    const updater = createOptimisticUpdater<string, string, TestData, TestUpdate>(100);

    updater.track('wallet', {
      apply: data => ({ ...data, yes: 5 }),
      id: 'yes',
      shouldIgnoreBackend: backendData => backendData.yes < 5,
    });

    expect(updater.mergeBackendData('wallet', { no: 2, yes: 1 })).toEqual({ no: 2, yes: 5 });
    expect(updater.mergeBackendData('wallet', { no: 2, yes: 5 })).toEqual({ no: 2, yes: 5 });
    expect(updater.mergeBackendData('wallet', { no: 2, yes: 1 })).toEqual({ no: 2, yes: 1 });
  });

  it('replaces tracked updates for the same subject', () => {
    const updater = createOptimisticUpdater<string, string, TestData, TestUpdate>(100);

    updater.track('wallet', { apply: data => ({ ...data, yes: 5 }), id: 'yes' });
    updater.track('wallet', { apply: data => ({ ...data, yes: 7 }), id: 'yes' });

    expect(updater.getUpdate('wallet', 'yes')?.apply({ yes: 0 })).toEqual({ yes: 7 });
    expect(updater.mergeBackendData('wallet', { yes: 1 })).toEqual({ yes: 7 });
  });

  it('replays subjects in write order and isolates each wallet', () => {
    const updater = createOptimisticUpdater<string, string, TestData, TestUpdate>(100);
    const balance = { balance: 2 };

    updater.track('wallet', { id: 'credit', apply: data => ({ balance: data.balance + 3 }) });
    updater.track('wallet', { id: 'double', apply: data => ({ balance: data.balance * 2 }) });
    updater.track('other-wallet', { id: 'credit', apply: () => ({ balance: 9 }) });

    expect(updater.mergeBackendData('wallet', balance)).toEqual({ balance: 10 });
    expect(updater.mergeBackendData('other-wallet', balance)).toEqual({ balance: 9 });

    updater.discard('wallet', 'credit');
    expect(updater.mergeBackendData('wallet', balance)).toEqual({ balance: 4 });
    expect(updater.mergeBackendData('other-wallet', balance)).toEqual({ balance: 9 });
  });

  it('drops expired updates and clears one key without affecting another', () => {
    const updater = createOptimisticUpdater<string, string, TestData, TestUpdate>(100);

    updater.track('wallet', { apply: data => ({ ...data, yes: 5 }), id: 'yes' });
    vi.mocked(Date.now).mockReturnValue(1_100);
    expect(updater.mergeBackendData('wallet', { yes: 1 })).toEqual({ yes: 1 });

    vi.mocked(Date.now).mockReturnValue(1_000);
    updater.track('wallet', { apply: data => ({ ...data, yes: 5 }), id: 'yes' });
    updater.track('other-wallet', { apply: data => ({ ...data, yes: 9 }), id: 'yes' });
    updater.clear('wallet');
    expect(updater.getUpdate('wallet', 'yes')).toBeUndefined();
    expect(updater.mergeBackendData('wallet', { yes: 1 })).toEqual({ yes: 1 });
    expect(updater.mergeBackendData('other-wallet', { yes: 1 })).toEqual({ yes: 9 });
  });
});
