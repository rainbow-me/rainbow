import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import Routes from '@/navigation/routesNames';
import ethUnits from '@/references/ethereum-units.json';

import * as estimates from '../../utils/handlers';
import { createEnsGasEstimateStore } from './createEnsGasEstimateStore';

vi.mock('@/state/navigation/navigationStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useNavigationStore: createBaseStore(() => ({ isRouteActive: () => true })) };
});

vi.mock('../../utils/handlers', () => ({
  estimateENSCommitGasLimit: vi.fn(),
  estimateENSRegisterSetRecordsAndNameGasLimit: vi.fn(),
  estimateENSRenewGasLimit: vi.fn(),
  estimateENSSetNameGasLimit: vi.fn(),
  estimateENSSetRecordsGasLimit: vi.fn(),
}));
vi.mock('../../utils/helpers', () => ({
  ENS_DOMAIN: '.eth',
  generateSalt: () => 'salt',
  REGISTRATION_STEPS: { COMMIT: 'COMMIT', REGISTER: 'REGISTER', RENEW: 'RENEW', EDIT: 'EDIT', SET_NAME: 'SET_NAME' },
}));
vi.mock('@/helpers/utilities', () => ({ add: (a: string | number, b: string | number) => String(BigInt(a) + BigInt(b)) }));

const input = {
  name: 'alice.eth',
  ownerAddress: '0x1111111111111111111111111111111111111111',
  duration: 31536000,
  rentPrice: '100',
  salt: 'commitment salt',
  records: { description: 'A profile' },
};
const stores: ReturnType<typeof createEnsGasEstimateStore>[] = [];
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(estimates.estimateENSCommitGasLimit).mockResolvedValue('50000');
  vi.mocked(estimates.estimateENSSetRecordsGasLimit).mockResolvedValue('80000');
  vi.mocked(estimates.estimateENSSetNameGasLimit).mockResolvedValue('60000');
});
afterEach(() => {
  for (const store of stores) store.getState().reset();
  stores.length = 0;
});

it('separates the commit fee from the total and includes only selected reverse writes', async () => {
  for (const setReverseRecord of [false, true]) {
    const store = createEnsGasEstimateStore(Routes.ENS_CONFIRM_REGISTER_SHEET);
    store.setState({ input: { ...input, step: 'COMMIT', setReverseRecord } });
    stores.push(store);
    expect(await store.getState().fetch()).toEqual({
      stepGasLimit: '50000',
      estimatedGasLimit: String(50000 + 80000 + ethUnits.ens_register_with_config + (setReverseRecord ? 60000 : 0)),
    });
  }
  expect(estimates.estimateENSSetNameGasLimit).toHaveBeenCalledTimes(1);
  expect(estimates.estimateENSSetNameGasLimit).toHaveBeenCalledWith(expect.objectContaining({ name: input.name }));
  expect(estimates.estimateENSSetRecordsGasLimit).toHaveBeenCalledWith({ name: input.name, records: input.records });

  vi.mocked(estimates.estimateENSSetRecordsGasLimit).mockResolvedValue(null);
  expect(await stores[0].getState().fetch(undefined, { force: true })).toEqual({ stepGasLimit: '50000', estimatedGasLimit: null });
});

it.each([
  ['SET_NAME', 'estimateENSSetNameGasLimit'],
  ['EDIT', 'estimateENSSetRecordsGasLimit'],
  ['RENEW', 'estimateENSRenewGasLimit'],
  ['REGISTER', 'estimateENSRegisterSetRecordsAndNameGasLimit'],
] as const)('estimates only the %s operation, retaining the full name', async (step, method) => {
  vi.mocked(estimates[method]).mockResolvedValue('120000');
  const store = createEnsGasEstimateStore(Routes.ENS_CONFIRM_REGISTER_SHEET);
  store.setState({ input: { ...input, step } });
  stores.push(store);
  expect(await store.getState().fetch()).toEqual({ stepGasLimit: '120000', estimatedGasLimit: '120000' });
  expect(estimates[method]).toHaveBeenCalledWith(expect.objectContaining({ name: input.name }));
  expect(Object.values(estimates).reduce((count, estimate) => count + vi.mocked(estimate).mock.calls.length, 0)).toBe(1);
});
