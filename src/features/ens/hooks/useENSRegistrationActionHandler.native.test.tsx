import React, { act } from 'react';

import { Wallet } from '@ethersproject/wallet';
import type { ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';
import { getAddress, toHex, zeroAddress, zeroHash } from 'viem';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { loadWallet } from '@/features/wallet/data/loadWallet';
import { getNextNonce } from '@/state/nonces';

import { executeEnsTransactions } from '../data/executeTransactions';
import { createEnsCommitment } from '../data/registration';
import { REGISTRATION_STEPS, type EnsCommitment, type RegistrationParameters } from '../types/registration';
import type { EnsAction } from '../types/transactions';
import { useENSRegistrationActionHandler } from './useENSRegistrationActionHandler';

const state = vi.hoisted(() => {
  const registration: RegistrationParameters = { name: 'alice.eth' };
  const records = {
    avatar: 'https://example.com/avatar.png',
    header: 'eip155:1/erc721:0x1111111111111111111111111111111111111111/1',
    description: '',
  };
  return { registration, records, goBack: vi.fn() };
});

vi.mock('@/features/wallet/data/loadWallet', () => ({ loadWallet: vi.fn() }));
vi.mock('@/handlers/web3', () => ({ getProvider: () => ({ on: vi.fn(), off: vi.fn() }) }));
vi.mock('@/state/nonces', () => ({ getNextNonce: vi.fn() }));
vi.mock('@/state/wallets/walletsStore', () => ({
  useAccountAddress: () => wallet.address,
  useIsHardwareWallet: () => true,
  refreshWalletInfo: vi.fn(),
}));
vi.mock('@/hooks/usePendingTransactions', () => ({ default: () => ({ getPendingTransactionByHash: vi.fn() }) }));
vi.mock('@/navigation/Navigation', () => ({ useNavigation: () => ({ goBack: state.goBack, navigate: vi.fn() }) }));
vi.mock('../data/executeTransactions', () => ({ executeEnsTransactions: vi.fn() }));
vi.mock('../data/registration', () => ({ createEnsCommitment: vi.fn() }));
vi.mock('./useENSRegistration', () => ({
  useENSRegistration: () => ({ registrationParameters: state.registration, changedRecords: state.records }),
}));

const renderer = await vi.importActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
const wallet = new Wallet('0x' + '1'.padStart(64, '0'));
const commitment: EnsCommitment = {
  owner: getAddress(wallet.address),
  registrar: zeroAddress,
  resolver: zeroAddress,
  duration: 31536000,
  secret: zeroHash,
  subregistry: zeroAddress,
  referrer: zeroHash,
};
const requestedYears = 3;
const requestedDuration = requestedYears * 31536000;
const freshCommitment = { ...commitment, duration: requestedDuration, secret: toHex(1, { size: 32 }) };
let current: ReturnType<typeof useENSRegistrationActionHandler> | undefined;

function Probe({ step }: { step: REGISTRATION_STEPS }) {
  current = useENSRegistrationActionHandler({ step, sendReverseRecord: true, yearsDuration: requestedYears });
  return null;
}

function render(step: REGISTRATION_STEPS) {
  act(() => renderer.render(<Probe step={step} />, 127, undefined, undefined));
  if (!current) throw new Error('Hook did not render');
  return current;
}

beforeEach(() => {
  vi.clearAllMocks();
  state.registration = { name: 'alice.eth', commitment };
  vi.mocked(loadWallet).mockResolvedValue(wallet);
  vi.mocked(getNextNonce).mockResolvedValue(7);
  vi.mocked(createEnsCommitment).mockResolvedValue(freshCommitment);
  vi.mocked(executeEnsTransactions).mockImplementation(async (_wallet, _action, nonce, onSubmitted) => {
    onSubmitted?.();
    return nonce + 1;
  });
});
afterEach(() => act(() => renderer.unmountComponentAtNode(127)));

const operations: [REGISTRATION_STEPS, EnsAction][] = [
  [REGISTRATION_STEPS.COMMIT, { type: 'commit', name: 'alice.eth', commitment: freshCommitment }],
  [REGISTRATION_STEPS.REGISTER, { type: 'register', name: 'alice.eth', commitment, records: state.records, setReverseRecord: true }],
  [REGISTRATION_STEPS.EDIT, { type: 'records', name: 'alice.eth', records: state.records, setReverseRecord: true }],
  [REGISTRATION_STEPS.RENEW, { type: 'renew', name: 'alice.eth', duration: requestedDuration }],
  [REGISTRATION_STEPS.SET_NAME, { type: 'primary', name: 'alice.eth' }],
];

it.each(operations)('submits %s with its own preparation and callback', async (step, expected) => {
  const onSubmitted = vi.fn();
  await render(step).submit(onSubmitted);

  expect(loadWallet).toHaveBeenCalledTimes(1);
  expect(getNextNonce).toHaveBeenCalledTimes(1);
  expect(executeEnsTransactions).toHaveBeenCalledExactlyOnceWith(wallet, expected, 7, expect.any(Function));
  expect(onSubmitted).toHaveBeenCalledTimes(1);
  expect(state.goBack).toHaveBeenCalledTimes(step === REGISTRATION_STEPS.COMMIT ? 1 : 0);
  expect(vi.mocked(createEnsCommitment).mock.calls).toEqual(
    step === REGISTRATION_STEPS.COMMIT ? [[wallet.address, requestedDuration]] : []
  );
});

it('finishes the original commit when the screen advances while submission is pending', async () => {
  const pendingSubmission = Promise.withResolvers<void>();
  const onSubmitted = vi.fn();
  vi.mocked(executeEnsTransactions).mockImplementation(async (_wallet, _action, nonce, callback) => {
    await pendingSubmission.promise;
    callback?.();
    return nonce + 1;
  });

  const submission = render(REGISTRATION_STEPS.COMMIT).submit(onSubmitted);
  await vi.waitFor(() => expect(executeEnsTransactions).toHaveBeenCalledTimes(1));
  render(REGISTRATION_STEPS.WAIT_COMMIT_CONFIRMATION);
  pendingSubmission.resolve();
  await submission;

  expect(executeEnsTransactions).toHaveBeenCalledExactlyOnceWith(
    wallet,
    { type: 'commit', name: 'alice.eth', commitment: freshCommitment },
    7,
    expect.any(Function)
  );
  expect(state.goBack).toHaveBeenCalledTimes(1);
  expect(onSubmitted).toHaveBeenCalledTimes(1);
});

it.each([REGISTRATION_STEPS.COMMIT, REGISTRATION_STEPS.REGISTER])('stops %s before preparation when unlocking is cancelled', async step => {
  vi.mocked(loadWallet).mockResolvedValue(null);
  await render(step).submit();

  expect(createEnsCommitment).not.toHaveBeenCalled();
  expect(getNextNonce).not.toHaveBeenCalled();
  expect(executeEnsTransactions).not.toHaveBeenCalled();
  expect(state.goBack).not.toHaveBeenCalled();
});
