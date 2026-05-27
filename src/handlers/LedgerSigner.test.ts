import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { ledgerService } from '@ledgerhq/hw-app-eth';

import { time } from '@/framework/core/utils/time';

import { LedgerSigner } from './LedgerSigner';

type LedgerSignature = {
  r: string;
  s: string;
  v: string;
};

const mockSignTransaction = jest.fn<Promise<LedgerSignature>, [string, string, unknown]>();
const mockGetEthApp = jest.fn();

jest.mock('@ledgerhq/hw-app-eth', () => ({
  ledgerService: {
    resolveTransaction: jest.fn(),
  },
}));

jest.mock('@/utils/ledger', () => ({
  getEthApp: (deviceId: string) => mockGetEthApp(deviceId),
}));

jest.mock('@/logger', () => ({
  ensureError: (error: unknown) => (error instanceof Error ? error : new Error(String(error))),
  logger: {
    DebugContext: { ledger: 'ledger' },
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
  RainbowError: class RainbowError extends Error {},
}));

jest.mock('@/navigation/Navigation', () => ({
  __esModule: true,
  default: { handleAction: jest.fn() },
}));

jest.mock('@/navigation/routesNames', () => ({
  __esModule: true,
  default: {
    PAIR_HARDWARE_WALLET_NAVIGATOR: 'PairHardwareWalletNavigator',
    PAIR_HARDWARE_WALLET_SIGNING_SHEET: 'PairHardwareWalletSigningSheet',
  },
}));

const LEDGER_PATH = "44'/60'/0'/0/0";
const RESOLUTION_TIMEOUT_MS = time.seconds(10);
const approvalTransaction = {
  chainId: 8453,
  data: '0x095ea7b300000000000000000000000022222222222222222222222222222222222222220000000000000000000000000000000000000000000000000000000000000001',
  gasLimit: 100_000,
  gasPrice: 1,
  nonce: 0,
  to: '0x1111111111111111111111111111111111111111',
  value: 0,
};

function buildSigner() {
  return new LedgerSigner(new StaticJsonRpcProvider('http://127.0.0.1:8545', 8453), LEDGER_PATH, 'ledger-device-id');
}

describe('LedgerSigner', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    mockGetEthApp.mockResolvedValue({
      loadConfig: {},
      signTransaction: mockSignTransaction,
    });
    mockSignTransaction.mockResolvedValue({
      r: `0x${'11'.repeat(32)}`,
      s: `0x${'22'.repeat(32)}`,
      v: '0x1b',
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('falls back to blind signing when Ledger transaction resolution fails', async () => {
    jest.mocked(ledgerService.resolveTransaction).mockRejectedValue(new Error('resolution unavailable'));

    await expect(buildSigner().signTransaction(approvalTransaction)).resolves.toEqual(expect.stringMatching(/^0x/));

    expect(mockSignTransaction).toHaveBeenCalledWith(LEDGER_PATH, expect.any(String), null);
  });

  it('falls back to blind signing when Ledger transaction resolution stalls', async () => {
    jest.useFakeTimers();
    jest.mocked(ledgerService.resolveTransaction).mockReturnValue(
      new Promise(() => {
        return;
      })
    );

    const signedTransaction = buildSigner().signTransaction(approvalTransaction);
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(RESOLUTION_TIMEOUT_MS);

    await expect(signedTransaction).resolves.toEqual(expect.stringMatching(/^0x/));
    expect(mockSignTransaction).toHaveBeenCalledWith(LEDGER_PATH, expect.any(String), null);
  });
});
