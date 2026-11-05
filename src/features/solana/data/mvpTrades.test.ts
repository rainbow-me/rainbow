import { Wallet } from '@ethersproject/wallet';
import { address } from '@solana/addresses';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BONK, BUY_AMOUNT, MAX_SELL_AMOUNT, SOLANA_USDC, solanaToken } from '@/features/solana/core/mvpRoutes';
import { assertSolanaSource, requireEnabledSolanaAccount } from '@/features/wallet/data/enableSolanaAccount';
import { withSolanaSigner } from '@/features/wallet/data/loadSolanaSigner';
import { loadWallet } from '@/features/wallet/data/loadWallet';
import { getSolanaAccount } from '@/features/wallet/data/stores/accountMetadataStore';

import { checkMvpExecution, executeMvpTrade, prepareMvpTrade, useSolanaMvpExecutionStore } from './mvpTrades';

const mocks = vi.hoisted(() => ({ prepare: vi.fn(), execute: vi.fn(), status: vi.fn(), send: vi.fn() }));
vi.mock('@rainbow-me/solana-sdk', async original => ({
  ...(await original<typeof import('@rainbow-me/solana-sdk')>()),
  execute: { prepare: { route: mocks.prepare }, route: mocks.execute, status: mocks.status },
}));
vi.mock('@solana/rpc', () => ({ createSolanaRpc: () => ({ getTokenAccountsByOwner: () => ({ send: mocks.send }) }) }));
vi.mock('./mvpSdk', () => ({ configureSolanaMvpSdk: vi.fn() }));
vi.mock('@/features/delegation/utils/calls', () => ({ createDelegationPublicClient: vi.fn() }));
vi.mock('@/features/wallet/data/enableSolanaAccount', () => ({ assertSolanaSource: vi.fn(), requireEnabledSolanaAccount: vi.fn() }));
vi.mock('@/features/wallet/data/loadWallet', () => ({ loadWallet: vi.fn() }));
vi.mock('@/features/wallet/data/loadSolanaSigner', () => ({ withSolanaSigner: vi.fn() }));
vi.mock('@/features/wallet/data/stores/accountMetadataStore', () => ({ getSolanaAccount: vi.fn() }));
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
  useSolanaMvpExecutionStore.setState({ attempt: null });
  vi.mocked(requireEnabledSolanaAccount).mockReturnValue(account);
  vi.mocked(getSolanaAccount).mockReturnValue(account);
  vi.mocked(loadWallet).mockResolvedValue(wallet);
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
      gasless: true,
      sponsorship: 'full',
      inputAmount: params.source.amount.input,
      expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60),
      output: {
        asset: params.destination.asset,
        amount: 100n,
        minimumAmount: 95n,
        decimals: params.source.asset.location === 'evm' ? 5 : 6,
      },
    },
  }));
  mocks.status.mockResolvedValue({ executionId, status: 'CONFIRMED' });
});

describe('MVP SDK entry points', () => {
  it('binds the EVM buy to the selected Solana recipient and submits the exact reviewed preparation', async () => {
    const trade = await prepareMvpTrade('buy');
    expect(mocks.prepare).toHaveBeenCalledWith(
      expect.objectContaining({
        account: wallet.address,
        gasless: true,
        sponsorship: 'required',
        destination: { asset: solanaToken(BONK), recipient: account.address },
        source: expect.objectContaining({ amount: { kind: 'exact-input', input: BUY_AMOUNT } }),
      })
    );
    await executeMvpTrade(trade);
    expect(mocks.execute.mock.calls[0][0]).toBe(trade.prepared);
    expect(mocks.execute.mock.calls[0][1].signer).toBe(wallet);
    expect(useSolanaMvpExecutionStore.getState().attempt?.status).toBe('CONFIRMED');
  });

  it('caps a Solana-source swap and loads only the Solana signer', async () => {
    const signer = { address: address(account.address), signTransactionMessage: vi.fn() };
    vi.mocked(withSolanaSigner).mockImplementation(async (_account, operation) => operation(signer));
    const trade = await prepareMvpTrade('sell');
    expect(trade.input).toBe(MAX_SELL_AMOUNT);
    expect(mocks.prepare).toHaveBeenCalledWith(
      expect.objectContaining({
        account: account.address,
        destination: { asset: solanaToken(SOLANA_USDC), recipient: account.address },
        gasless: true,
        sponsorship: 'required',
      })
    );
    await executeMvpTrade(trade);
    expect(loadWallet).not.toHaveBeenCalled();
    expect(mocks.execute.mock.calls[0][1].signer).toBe(signer);
  });

  it('keeps ambiguous submissions across retries and unlocks new swaps only after terminal status', async () => {
    const trade = await prepareMvpTrade('buy');
    mocks.execute.mockRejectedValueOnce(new Error('network interrupted'));
    await expect(executeMvpTrade(trade)).rejects.toThrow('network interrupted');
    expect(useSolanaMvpExecutionStore.getState().attempt?.executionId).toBe(executionId);
    await expect(prepareMvpTrade('buy')).rejects.toThrow('previous execution');
    await expect(executeMvpTrade(trade)).rejects.toThrow('already submitted');
    await checkMvpExecution();
    await expect(prepareMvpTrade('buy')).resolves.toBeDefined();
    expect(mocks.execute).toHaveBeenCalledTimes(1);
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
