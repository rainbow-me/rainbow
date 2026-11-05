import { expect, it, vi } from 'vitest';

import { getSolanaSource } from '@/features/wallet/data/enableSolanaAccount';
import { configure, createRelayService } from '@rainbow-me/solana-sdk';

import { configureSolanaMvpSdk } from './mvpSdk';

vi.mock('@rainbow-me/solana-sdk', () => ({ configure: vi.fn(), createRelayService: vi.fn() }));
vi.mock('react-native-dotenv', () => ({
  RAINBOW_RELAY_API_KEY: 'test',
  RAINBOW_RELAY_URL: 'https://example.invalid',
  RAINBOW_RELAY_QUOTE_SIGNER: '0x0000000000000000000000000000000000000001',
}));
vi.mock('@/features/config/stores/experimentalConfigStore', () => ({ getExperimentalFlag: () => false }));
vi.mock('@/features/config/stores/remoteConfig', () => ({ useRemoteConfigStore: { getState: vi.fn() } }));
vi.mock('@/features/wallet/data/enableSolanaAccount', () => ({ getSolanaSource: vi.fn() }));
vi.mock('@/resources/platform/client', () => ({ getPlatformClient: () => ({}) }));
vi.mock('@/state/wallets/walletsStore', () => ({ useWalletsStore: {} }));
vi.mock('@/logger', () => ({ logger: { DebugContext: { sdk: 'sdk' }, createServiceLogger: () => ({}) } }));

it('gates configuration and isolates the preview SDK cache from production persistence and sync', async () => {
  vi.mocked(getSolanaSource).mockImplementationOnce(() => {
    throw new Error('disabled');
  });
  expect(configureSolanaMvpSdk).toThrow('disabled');
  expect(configure).not.toHaveBeenCalled();
  configureSolanaMvpSdk();
  configureSolanaMvpSdk();
  expect(configure).toHaveBeenCalledTimes(1);
  expect(createRelayService).toHaveBeenCalledWith(expect.objectContaining({ relayDomain: expect.objectContaining({ relayVersion: 2n }) }));
  const options = vi.mocked(configure).mock.calls[0][0].storeOptions;
  expect(options).toBeDefined();
  if (!options) throw new Error('Missing SDK cache isolation');
  await options.storage.set('delegationStatus', 'preview');
  expect(await options.storage.get('delegationStatus')).toBeUndefined();
  expect(await options.storage.getAllKeys()).toEqual([]);
  expect(options.sync.engine.sessionId).toBe('solana-mvp');
});
