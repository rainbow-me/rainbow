import { getAddress, toHex, zeroAddress, zeroHash } from 'viem';
import { expect, it, vi } from 'vitest';

import Routes from '@/navigation/routesNames';

import { createEnsCommitment } from '../registration';
import { estimateEnsRegistration, estimateEnsTransactions } from '../transactions';
import { createEnsGasEstimateStore } from './createEnsGasEstimateStore';

vi.mock('@/state/navigation/navigationStore', async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { useNavigationStore: createBaseStore(() => ({ isRouteActive: () => true })) };
});
vi.mock('../registration', () => ({ createEnsCommitment: vi.fn() }));
vi.mock('../transactions', () => ({ estimateEnsRegistration: vi.fn(), estimateEnsTransactions: vi.fn() }));

it('previews registration before commit and estimates the saved terms for reveal', async () => {
  const account = getAddress('0x1111111111111111111111111111111111111111');
  const input = { name: 'alice.eth', account, duration: 31536000, records: { description: 'A profile' }, setReverseRecord: true };
  const commitment = {
    duration: input.duration,
    owner: account,
    registrar: zeroAddress,
    resolver: zeroAddress,
    subregistry: zeroAddress,
    secret: zeroHash,
    referrer: zeroHash,
  };
  vi.mocked(createEnsCommitment).mockResolvedValue(commitment);
  vi.mocked(estimateEnsRegistration).mockResolvedValue({ step: '50000', total: '110000' });
  vi.mocked(estimateEnsTransactions).mockResolvedValue('60000');

  const store = createEnsGasEstimateStore(Routes.ENS_CONFIRM_REGISTER_SHEET);
  try {
    store.setState({ input: { ...input, step: 'COMMIT' } });
    expect(await store.getState().fetch()).toEqual({ step: '50000', total: '110000' });

    const saved = { ...commitment, secret: toHex(1, { size: 32 }) };
    store.setState({ input: { ...input, step: 'REGISTER', commitment: saved } });
    expect(await store.getState().fetch()).toEqual({ step: '60000', total: '60000' });
    expect(estimateEnsTransactions).toHaveBeenCalledWith(
      { type: 'register', name: input.name, commitment: saved, records: input.records, setReverseRecord: true },
      account
    );
    expect(createEnsCommitment).toHaveBeenCalledTimes(1);
  } finally {
    store.getState().reset();
  }
});
