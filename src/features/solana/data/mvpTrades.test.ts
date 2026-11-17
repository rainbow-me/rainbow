import { Wallet } from '@ethersproject/wallet';
import { address } from '@solana/addresses';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BASE_USDC, BONK, MAX_SELL_AMOUNT, SOL, SOL_TO_BASE_AMOUNT, SOLANA_USDC, solanaToken } from '@/features/solana/core/mvpRoutes';
import { assertSolanaSource, requireEnabledSolanaAccount } from '@/features/wallet/data/enableSolanaAccount';
import { withSolanaSigner } from '@/features/wallet/data/loadSolanaSigner';
import { loadWallet } from '@/features/wallet/data/loadWallet';
import { getSolanaAccount } from '@/features/wallet/data/stores/accountMetadataStore';
import { fetchExternalToken } from '@/resources/assets/externalAssetsQuery';
import { ManagedExecutionFailedError } from '@rainbow-me/solana-sdk';

import { checkMvpExecution, executeMvpTrade, prepareMvpTrade, useSolanaMvpExecutionStore } from './mvpTrades';

const mocks = vi.hoisted(() => ({ prepare: vi.fn(), execute: vi.fn(), status: vi.fn(), send: vi.fn(), balance: vi.fn() }));
vi.mock('@rainbow-me/solana-sdk', async original => ({
  ...(await original<typeof import('@rainbow-me/solana-sdk')>()),
  execute: { prepare: { route: mocks.prepare }, route: mocks.execute, status: mocks.status },
}));
vi.mock('@solana/rpc', () => ({
  createSolanaRpc: () => ({ getTokenAccountsByOwner: () => ({ send: mocks.send }), getBalance: () => ({ send: mocks.balance }) }),
}));
vi.mock('./mvpSdk', () => ({ configureSolanaMvpSdk: vi.fn() }));
vi.mock('@/features/delegation/utils/calls', () => ({ createDelegationPublicClient: vi.fn() }));
vi.mock('@/features/wallet/data/enableSolanaAccount', () => ({ assertSolanaSource: vi.fn(), requireEnabledSolanaAccount: vi.fn() }));
vi.mock('@/features/wallet/data/loadWallet', () => ({ loadWallet: vi.fn() }));
vi.mock('@/features/wallet/data/loadSolanaSigner', () => ({ withSolanaSigner: vi.fn() }));
vi.mock('@/features/wallet/data/stores/accountMetadataStore', () => ({ getSolanaAccount: vi.fn() }));
vi.mock('@/resources/assets/externalAssetsQuery', () => ({ fetchExternalToken: vi.fn() }));
vi.mock('@/handlers/web3', () => ({ getProvider: vi.fn() }));

const wallet = Wallet.fromMnemonic('abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about');
const account = {
  walletId: 'test',
  index: 0,
  namespace: 'solana' as const,
  version: 1 as const,
  sourceEvmAddress: wallet.address,
  address: 'HAgk14JpMQLgt6rVgv7cBQFJWFto5Dqxi472uT3DKpqk',
};
const executionId = `0x${'01'.repeat(32)}` as const;

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchExternalToken).mockResolvedValue({ price: { value: 2000 } } as Awaited<ReturnType<typeof fetchExternalToken>>);
  useSolanaMvpExecutionStore.setState({ attempt: null });
  vi.mocked(requireEnabledSolanaAccount).mockReturnValue(account);
  vi.mocked(getSolanaAccount).mockReturnValue(account);
  vi.mocked(loadWallet).mockResolvedValue(wallet);
  vi.mocked(withSolanaSigner).mockImplementation(async (_account, operation) =>
    operation({ address: address(account.address), signTransactionMessage: vi.fn() })
  );
  mocks.balance.mockResolvedValue({ value: 13_686_013n });
  mocks.execute.mockResolvedValue({ executionId });
  mocks.send.mockResolvedValue({
    value: [
      {
        account: {
          data: {
            parsed: {
              info: {
                owner: account.address,
                mint: BONK,
                tokenAmount: { amount: String(MAX_SELL_AMOUNT * 2n) },
              },
            },
          },
        },
      },
    ],
  });
  mocks.prepare.mockImplementation(async params => ({
    kind: 'route.managed',
    executionId,
    review: {
      gasless: params.source.asset.location === 'evm',
      sponsorship: 'full',
      inputAmount: params.source.amount.input,
      expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60),
      output: {
        asset: params.destination.asset,
        amount: 100n,
        minimumAmount: 95n,
        decimals: params.source.asset.location === 'evm' ? 9 : 6,
      },
    },
  }));
  mocks.status.mockResolvedValue({ executionId, status: 'CONFIRMED' });
});

describe('MVP SDK entry points', () => {
  it('binds the EVM buy to the selected Solana recipient and submits the exact reviewed preparation', async () => {
    const trade = await prepareMvpTrade('buy');
    expect(fetchExternalToken).toHaveBeenCalledWith({ address: 'eth', chainId: 1, currency: 'USD' });
    expect(mocks.prepare).toHaveBeenCalledWith(
      expect.objectContaining({
        account: wallet.address,
        gasless: true,
        sponsorship: 'required',
        destination: { asset: SOL, recipient: account.address },
        source: {
          asset: { location: 'evm', kind: 'native', chainId: 8453 },
          amount: { kind: 'exact-input', input: 500_000_000_000_000n },
        },
      })
    );
    await executeMvpTrade(trade);
    expect(mocks.execute.mock.calls[0][0]).toBe(trade.prepared);
    expect(mocks.execute.mock.calls[0][1].signer).toBe(wallet);
    expect(useSolanaMvpExecutionStore.getState().attempt?.status).toBe('PENDING');
  });

  it('does not prepare or sign a buy when ETH pricing is unavailable', async () => {
    vi.mocked(fetchExternalToken).mockResolvedValue(null);
    await expect(prepareMvpTrade('buy')).rejects.toThrow('Unable to price');
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(loadWallet).not.toHaveBeenCalled();
  });

  it('caps a Solana-source swap and loads only the Solana signer', async () => {
    const signer = { address: address(account.address), signTransactionMessage: vi.fn() };
    vi.mocked(withSolanaSigner).mockImplementation(async (_account, operation) => operation(signer));
    const trade = await prepareMvpTrade('sell');
    expect(trade.input).toBe(MAX_SELL_AMOUNT);
    expect(mocks.prepare.mock.calls[0][0]).not.toHaveProperty('gasless');
    expect(mocks.prepare).toHaveBeenCalledWith(
      expect.objectContaining({
        account: account.address,
        destination: { asset: solanaToken(SOLANA_USDC), recipient: account.address },
        sponsorship: 'required',
      })
    );
    await executeMvpTrade(trade);
    expect(loadWallet).not.toHaveBeenCalled();
    expect(mocks.execute.mock.calls[0][1].signer).toBe(signer);
  });

  it('routes native SOL to the selected EVM account on Base using the Solana signer', async () => {
    const trade = await prepareMvpTrade('solToBase');
    expect(trade.input).toBe(10_000_000n);
    expect(mocks.prepare.mock.calls[0][0]).not.toHaveProperty('gasless');
    expect(mocks.prepare).toHaveBeenCalledWith(
      expect.objectContaining({
        account: account.address,
        source: { asset: SOL, amount: { kind: 'exact-input', input: SOL_TO_BASE_AMOUNT } },
        destination: { asset: BASE_USDC, recipient: wallet.address },
        sponsorship: 'required',
      })
    );
    await executeMvpTrade(trade);
    expect(withSolanaSigner).toHaveBeenCalled();
    expect(loadWallet).not.toHaveBeenCalled();
  });

  it.each([0n, SOL_TO_BASE_AMOUNT - 1n, SOL_TO_BASE_AMOUNT])(
    'rejects SOL balance %s without room for fees before preparing',
    async balance => {
      mocks.balance.mockResolvedValue({ value: balance });
      await expect(prepareMvpTrade('solToBase')).rejects.toThrow('SOL for network fees');
      expect(mocks.prepare).not.toHaveBeenCalled();
      expect(withSolanaSigner).not.toHaveBeenCalled();
    }
  );

  it('requires SOL for fees even when swapping BONK', async () => {
    mocks.balance.mockResolvedValue({ value: 0n });
    await expect(prepareMvpTrade('sell')).rejects.toThrow('SOL for network fees');
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(withSolanaSigner).not.toHaveBeenCalled();
  });

  it('keeps ambiguous submissions across retries and unlocks new swaps only after terminal status', async () => {
    const trade = await prepareMvpTrade('buy');
    mocks.execute.mockRejectedValueOnce(new Error('network interrupted'));
    await expect(executeMvpTrade(trade)).rejects.toThrow('network interrupted');
    expect(useSolanaMvpExecutionStore.getState().attempt?.executionId).toBe(executionId);
    expect(useSolanaMvpExecutionStore.getState().attempt?.status).toBe('SUBMISSION_UNCERTAIN');
    await expect(prepareMvpTrade('buy')).rejects.toThrow('previous execution');
    await expect(executeMvpTrade(trade)).rejects.toThrow('already submitted');
    await checkMvpExecution();
    await expect(prepareMvpTrade('buy')).resolves.toBeDefined();
    expect(mocks.execute).toHaveBeenCalledTimes(1);
  });

  it.each(['buy', 'sell', 'solToBase'] as const)('keeps an accepted %s pending when a separate status request fails', async route => {
    const trade = await prepareMvpTrade(route);
    mocks.status.mockRejectedValueOnce(new Error('status unavailable'));
    await expect(executeMvpTrade(trade)).resolves.toBeUndefined();
    expect(mocks.status).not.toHaveBeenCalled();
    expect(useSolanaMvpExecutionStore.getState().attempt).toMatchObject({ executionId, status: 'PENDING' });
    await expect(checkMvpExecution()).rejects.toThrow('status unavailable');
    expect(useSolanaMvpExecutionStore.getState().attempt?.status).toBe('PENDING');
    await expect(prepareMvpTrade(route)).rejects.toThrow('previous execution');
    await expect(executeMvpTrade(trade)).rejects.toThrow('already submitted');
    await checkMvpExecution();
    expect(useSolanaMvpExecutionStore.getState().attempt?.status).toBe('CONFIRMED');
    await expect(prepareMvpTrade(route)).resolves.toBeDefined();
  });

  it.each(['buy', 'sell', 'solToBase'] as const)(
    'records a definitive SDK failure for %s without requiring a status request',
    async route => {
      const trade = await prepareMvpTrade(route);
      const error = new ManagedExecutionFailedError(executionId, { code: 'INSUFFICIENT_SPONSOR_BALANCE', message: 'Sponsor unavailable' });
      mocks.execute.mockRejectedValueOnce(error);
      await expect(executeMvpTrade(trade)).rejects.toBe(error);
      expect(useSolanaMvpExecutionStore.getState().attempt).toMatchObject({ executionId, status: 'FAILED' });
      expect(mocks.status).not.toHaveBeenCalled();
      await expect(prepareMvpTrade(route)).resolves.toBeDefined();
      await expect(executeMvpTrade(trade)).rejects.toThrow('already submitted');
    }
  );

  it('does not mark the current attempt failed for a different SDK execution', async () => {
    const trade = await prepareMvpTrade('buy');
    mocks.execute.mockRejectedValueOnce(new ManagedExecutionFailedError(`0x${'02'.repeat(32)}`, { code: 'FAILED' }));
    await expect(executeMvpTrade(trade)).rejects.toThrow();
    expect(useSolanaMvpExecutionStore.getState().attempt).toMatchObject({ executionId, status: 'SUBMISSION_UNCERTAIN' });
    await expect(prepareMvpTrade('buy')).rejects.toThrow('previous execution');
  });

  it('preserves confirmation received while the SDK submission is still returning', async () => {
    const trade = await prepareMvpTrade('buy');
    mocks.execute.mockImplementationOnce(async () => {
      await checkMvpExecution();
      return { executionId };
    });
    await executeMvpTrade(trade);
    expect(useSolanaMvpExecutionStore.getState().attempt?.status).toBe('CONFIRMED');
  });

  it('refuses changed selection after authentication, before submission', async () => {
    const trade = await prepareMvpTrade('buy');
    vi.mocked(loadWallet).mockImplementationOnce(async () => {
      vi.mocked(assertSolanaSource).mockImplementation(() => {
        throw new Error('account changed');
      });
      return wallet;
    });
    await expect(executeMvpTrade(trade)).rejects.toThrow('account changed');
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(useSolanaMvpExecutionStore.getState().attempt).toBeNull();
  });
});
