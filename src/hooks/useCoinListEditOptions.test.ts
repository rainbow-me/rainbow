import { beforeEach, expect, it, vi } from 'vitest';

import { EditAction } from '@/helpers/EditAction';

import useCoinListEditOptions, { useCoinListFinishEditingOptions } from './useCoinListEditOptions';

const state = vi.hoisted(() => ({
  address: '0xAccount',
  selected: [] as string[],
  hidden: new Set<string>(),
  storage: {} as Record<string, Record<string, boolean>>,
  setHidden: vi.fn(),
}));
vi.mock('react', () => ({
  useCallback: (fn: unknown) => fn,
  useMemo: (fn: () => unknown) => fn(),
  useRef: () => ({ current: undefined }),
}));
vi.mock('recoil', () => {
  const set = (next: string[] | ((prev: string[]) => string[])) => {
    state.selected = typeof next === 'function' ? next(state.selected) : next;
  };
  return { atom: () => null, useSetRecoilState: () => set, useRecoilState: () => [state.selected, set] };
});
vi.mock('react-native-mmkv', () => ({
  useMMKVObject: (key: string) => [
    state.storage[key],
    (set: (prev: Record<string, boolean> | undefined) => Record<string, boolean>) => {
      state.storage[key] = set(state.storage[key]);
    },
  ],
}));
vi.mock('@/state/wallets/walletsStore', () => ({ useAccountAddress: () => state.address }));
vi.mock('@/state/assets/userAssets', () => ({
  useUserAssetsStore: (selector: (value: unknown) => unknown) =>
    selector({ getHiddenAssetsIds: () => [...state.hidden], setHiddenAssets: state.setHidden }),
}));
const id = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v_1399811149';
beforeEach(() => {
  state.address = '0xAccount';
  state.selected = [];
  state.hidden = new Set();
  state.storage = {};
  state.setHidden.mockReset();
});
it('preserves Solana casing for pin/unpin while retaining EVM normalization', () => {
  const actions = useCoinListEditOptions();
  actions.addPinnedCoin(id);
  actions.addPinnedCoin('0xAbC_1');
  expect(state.storage['pinned-coins-obj-0xAccount']).toEqual({ [id]: true, '0xabc_1': true });
  actions.removePinnedCoin(id);
  expect(state.storage['pinned-coins-obj-0xAccount']).toEqual({ '0xabc_1': true });
});
it('pins mixed selections and keeps preferences scoped to the selected EVM account', () => {
  state.selected = [id, '0xabc_1'];
  useCoinListFinishEditingOptions().setPinnedCoins();
  expect(state.storage['pinned-coins-obj-0xAccount']).toEqual({ [id]: true, '0xabc_1': true });
  expect(state.selected).toEqual([]);
  state.address = '0xOther';
  expect(useCoinListEditOptions().pinnedCoinsObj).toEqual({});
});
it('passes the exact Solana ID through hide and unhide actions', () => {
  state.selected = [id];
  let actions = useCoinListFinishEditingOptions();
  expect(actions.currentAction).toBe(EditAction.standard);
  actions.setHiddenCoins();
  expect(state.setHidden).toHaveBeenCalledWith([id]);
  state.hidden.add(id);
  state.selected = [id];
  actions = useCoinListFinishEditingOptions();
  expect(actions.currentAction).toBe(EditAction.unhide);
  actions.setHiddenCoins();
  expect(state.setHidden).toHaveBeenLastCalledWith([id]);
});

it('retains old CAIP pins and allows unpinning them with the new ID', () => {
  const oldId = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
  state.storage['pinned-coins-obj-0xAccount'] = { [oldId]: true, '0xabc_1': true };
  expect(useCoinListEditOptions().pinnedCoinsObj).toEqual({ [id]: true, '0xabc_1': true });
  state.selected = [id];
  const actions = useCoinListFinishEditingOptions();
  expect(actions.currentAction).toBe(EditAction.unpin);
  actions.setPinnedCoins();
  expect(state.storage['pinned-coins-obj-0xAccount']).toEqual({ '0xabc_1': true });
});
