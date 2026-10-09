import { getAddress, type Address } from 'viem';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';

import { resolveEnsName } from './ens';
import { useEnsNameStore } from './useEnsNameStore';

vi.mock('./ens', () => ({ resolveEnsName: vi.fn() }));

const ADDRESS: Address = '0x52908400098527886E0F7030069857D2E4169EE7';
const LOWERCASE_ADDRESS: Address = '0x52908400098527886e0f7030069857d2e4169ee7';
const SECOND_ADDRESS: Address = '0x2222222222222222222222222222222222222222';
const resolveName = vi.mocked(resolveEnsName);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
  resolveName.mockReset();
});

afterEach(() => vi.useRealTimers());

it('shares a verified mainnet name across address spellings and refreshes mounted readers after five minutes', async () => {
  resolveName.mockResolvedValueOnce('first.eth').mockResolvedValueOnce('updated.eth');
  const first = useEnsNameStore.subscribe(s => s.get(ADDRESS), vi.fn());
  const second = useEnsNameStore.subscribe(s => s.get(LOWERCASE_ADDRESS), vi.fn());
  await flush();
  expect(resolveName).toHaveBeenCalledTimes(1);
  expect(resolveName.mock.calls[0].slice(0, 2)).toEqual([getAddress(ADDRESS), ChainId.mainnet]);
  expect(useEnsNameStore.getState().get(ADDRESS)).toBe('first.eth');

  vi.advanceTimersByTime(time.minutes(5));
  await flush();
  expect(resolveName).toHaveBeenCalledTimes(2);
  expect(useEnsNameStore.getState().get(LOWERCASE_ADDRESS)).toBe('updated.eth');
  first();
  second();
  await flush();
});

it('retains a missing name as null and prunes expired data on a later fetch', async () => {
  resolveName.mockResolvedValue(null);
  const stop = useEnsNameStore.subscribe(s => s.get(SECOND_ADDRESS), vi.fn());
  await flush();
  expect(useEnsNameStore.getState().get(SECOND_ADDRESS)).toBeNull();
  stop();
  await flush();

  vi.advanceTimersByTime(time.minutes(30));
  expect(useEnsNameStore.getState().get(SECOND_ADDRESS)).toBeNull();
  vi.advanceTimersByTime(time.minutes(30));
  await useEnsNameStore.getState().refresh(ADDRESS);
  expect(useEnsNameStore.getState().get(SECOND_ADDRESS)).toBeUndefined();
  expect(resolveName).toHaveBeenCalledTimes(2);
});

function flush(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}
