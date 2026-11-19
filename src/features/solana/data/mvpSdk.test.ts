import { expect, it, vi } from 'vitest';

import { getSolanaSource } from '@/features/wallet/data/enableSolanaAccount';
import { configure, createRelayService } from '@rainbow-me/solana-sdk';

import { configureSolanaMvpSdk, takeSolanaRouteMessage } from './mvpSdk';

const mocks = vi.hoisted(() => ({ prepare: vi.fn() }));
vi.mock('@rainbow-me/solana-sdk', () => ({ configure: vi.fn(), createRelayService: vi.fn(() => ({ prepare: mocks.prepare })) }));
vi.mock('react-native-dotenv', () => ({
  RAINBOW_RELAY_API_KEY: 'test',
  RAINBOW_RELAY_URL: 'https://reference-relay.example.invalid',
  RAINBOW_RELAY_QUOTE_SIGNER: '0x0000000000000000000000000000000000000001',
}));
vi.mock('@/features/config/stores/experimentalConfigStore', () => ({ getExperimentalFlag: () => true }));
vi.mock('@/features/config/stores/remoteConfig', () => ({
  useRemoteConfigStore: { getState: () => ({ getRemoteConfigKey: () => true }) },
}));
vi.mock('@/features/wallet/data/enableSolanaAccount', () => ({ getSolanaSource: vi.fn() }));
vi.mock('@/resources/platform/client', () => ({ getPlatformClient: () => ({}) }));
vi.mock('@/state/wallets/walletsStore', () => ({ useWalletsStore: {} }));
vi.mock('@/logger', () => ({ logger: { DebugContext: { sdk: 'sdk' }, createServiceLogger: () => ({}) } }));

it('uses the reference relay even with Go enabled, gates configuration and isolates the preview cache', async () => {
  vi.mocked(getSolanaSource).mockImplementationOnce(() => {
    throw new Error('disabled');
  });
  expect(configureSolanaMvpSdk).toThrow('disabled');
  expect(configure).not.toHaveBeenCalled();
  configureSolanaMvpSdk();
  configureSolanaMvpSdk();
  expect(configure).toHaveBeenCalledTimes(1);
  expect(createRelayService).toHaveBeenCalledWith({
    apiKey: 'test',
    baseUrl: 'https://reference-relay.example.invalid',
    relayDomain: {
      environment: 'production',
      relayId: 'rainbow-relay',
      relayVersion: 2n,
      prepareSigner: '0x0000000000000000000000000000000000000001',
    },
  });
  const options = vi.mocked(configure).mock.calls[0][0].storeOptions;
  expect(options).toBeDefined();
  if (!options) throw new Error('Missing SDK cache isolation');
  await options.storage.set('delegationStatus', 'preview');
  expect(await options.storage.get('delegationStatus')).toBeUndefined();
  expect(await options.storage.getAllKeys()).toEqual([]);
  expect(options.sync.engine.sessionId).toBe('solana-mvp');
});

it('retains the exact source message by execution ID without changing the prepared response', async () => {
  configureSolanaMvpSdk();
  const relay = vi.mocked(configure).mock.calls[0][0].relayService;
  if (!relay) throw new Error('Missing relay');
  const request = { intent: { kind: 'asset-route' } } as Parameters<typeof relay.prepare>[0];
  const firstId = `0x${'01'.repeat(32)}` as const;
  const secondId = `0x${'02'.repeat(32)}` as const;
  const first = {
    executionId: firstId,
    walletProgram: [{ kind: 'signTransaction', transaction: { messageBytes: new Uint8Array([1, 2, 3]) } }],
  };
  const second = {
    executionId: secondId,
    walletProgram: [{ kind: 'signTransaction', transaction: { messageBytes: new Uint8Array([4, 5, 6]) } }],
  };
  mocks.prepare.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
  expect(await relay.prepare(request)).toBe(first);
  expect(await relay.prepare(request)).toBe(second);
  expect(takeSolanaRouteMessage(secondId)).toBe('BAUG');
  expect(takeSolanaRouteMessage(firstId)).toBe('AQID');
  expect(() => takeSolanaRouteMessage(firstId)).toThrow('Unable to estimate');
});

it('does not retain EVM wallet steps and bounds abandoned preparation messages', async () => {
  const relay = vi.mocked(configure).mock.calls[0][0].relayService;
  if (!relay) throw new Error('Missing relay');
  const request = { intent: { kind: 'asset-route' } } as Parameters<typeof relay.prepare>[0];
  const evmId = `0x${'03'.repeat(32)}` as const;
  mocks.prepare.mockResolvedValueOnce({ executionId: evmId, walletProgram: [{ kind: 'signTypedData' }] });
  await relay.prepare(request);
  expect(() => takeSolanaRouteMessage(evmId)).toThrow('Unable to estimate');
  for (let i = 1; i <= 9; i++) {
    mocks.prepare.mockResolvedValueOnce({
      executionId: `0x${String(i).padStart(64, '0')}`,
      walletProgram: [{ kind: 'signTransaction', transaction: { messageBytes: new Uint8Array([i]) } }],
    });
    await relay.prepare(request);
  }
  expect(() => takeSolanaRouteMessage(`0x${'1'.padStart(64, '0')}`)).toThrow('Unable to estimate');
  expect(takeSolanaRouteMessage(`0x${'9'.padStart(64, '0')}`)).toBe('CQ==');
});
