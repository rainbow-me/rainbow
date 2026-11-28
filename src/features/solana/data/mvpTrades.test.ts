import { Wallet } from '@ethersproject/wallet';
import { address } from '@solana/addresses';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BASE_USDC, BONK, MAX_SELL_AMOUNT, SOL, SOL_TO_BASE_AMOUNT, SOLANA_USDC, solanaToken } from '@/features/solana/core/mvpRoutes';
import { assertSolanaSource, getEnabledSolanaAccount } from '@/features/wallet/data/enableSolanaAccount';
import { withSolanaSigner } from '@/features/wallet/data/loadSolanaSigner';
import { loadWallet } from '@/features/wallet/data/loadWallet';
import { getSolanaAccount } from '@/features/wallet/data/stores/accountMetadataStore';
import { getProvider } from '@/handlers/web3';
import { fetchExternalToken } from '@/resources/assets/externalAssetsQuery';
import { ManagedExecutionFailedError } from '@rainbow-me/solana-sdk';

import { SOLANA_MAINNET_CHAIN } from '../core/chainId';
import { SWAP_ASSETS } from '../core/swap';
import { parseSolanaSearchResults } from '../core/tokenSearch';
import {
  checkMvpExecution,
  executeMvpTrade,
  getSwapBalances,
  prepareMvpTrade,
  prepareSwapTrade,
  useSolanaMvpExecutionStore,
} from './mvpTrades';

const mocks = vi.hoisted(() => ({
  prepare: vi.fn(),
  execute: vi.fn(),
  status: vi.fn(),
  send: vi.fn(),
  balance: vi.fn(),
  baseBalance: vi.fn(),
  fee: vi.fn(),
  feeRequest: vi.fn(),
}));
vi.mock('@rainbow-me/solana-sdk', async original => ({
  ...(await original<typeof import('@rainbow-me/solana-sdk')>()),
  execute: { prepare: { route: mocks.prepare }, route: mocks.execute, status: mocks.status },
}));
vi.mock('@solana/rpc', () => ({
  createSolanaRpc: () => ({
    getTokenAccountsByOwner: () => ({ send: mocks.send }),
    getBalance: () => ({ send: mocks.balance }),
    getFeeForMessage: mocks.feeRequest,
  }),
}));
vi.mock('./mvpSdk', () => ({ configureSolanaMvpSdk: vi.fn(), takeSolanaRouteMessage: () => 'AQID' }));
vi.mock('@/features/delegation/utils/calls', () => ({ createDelegationPublicClient: vi.fn() }));
vi.mock('@/features/wallet/data/enableSolanaAccount', () => ({ assertSolanaSource: vi.fn(), getEnabledSolanaAccount: vi.fn() }));
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
  vi.mocked(getEnabledSolanaAccount).mockReturnValue(account);
  vi.mocked(getSolanaAccount).mockReturnValue(account);
  vi.mocked(loadWallet).mockResolvedValue(wallet);
  vi.mocked(withSolanaSigner).mockImplementation(async (_account, operation) =>
    operation({ address: address(account.address), signTransactionMessage: vi.fn() })
  );
  vi.mocked(getProvider).mockReturnValue({ getBalance: mocks.baseBalance } as unknown as ReturnType<typeof getProvider>);
  mocks.baseBalance.mockResolvedValue(1000000000000000000n);
  mocks.feeRequest.mockReturnValue({ send: mocks.fee });
  mocks.fee.mockResolvedValue({ value: 5000n });
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
      feeEstimate: { totalAmountUsd: 0.5, sponsoredAmountUsd: 0.5 },
      inputAmount: params.source.amount.input,
      expiresAt: BigInt(Math.floor(Date.now() / 1000) + 60),
      output: {
        asset: params.destination.asset,
        amount: 100n,
        minimumAmount: 95n,
        decimals: params.destination.asset.kind === 'native' ? 9 : params.destination.asset.address === BONK ? 5 : 6,
      },
    },
  }));
  mocks.status.mockResolvedValue({ executionId, status: 'CONFIRMED' });
});

describe('MVP SDK entry points', () => {
  it.each(['buy', 'buyBonk'] as const)(
    'binds %s to the selected Solana recipient and submits the exact reviewed preparation',
    async route => {
      const trade = await prepareMvpTrade(route);
      expect(fetchExternalToken).toHaveBeenCalledWith({ address: 'eth', chainId: 1, currency: 'USD' });
      expect(mocks.prepare).toHaveBeenCalledWith(
        expect.objectContaining({
          account: wallet.address,
          gasless: true,
          sponsorship: 'required',
          destination: { asset: route === 'buyBonk' ? solanaToken(BONK) : SOL, recipient: account.address },
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
    }
  );

  it.each(['buy', 'buyBonk'] as const)('does not prepare or sign %s when ETH pricing is unavailable', async route => {
    vi.mocked(fetchExternalToken).mockResolvedValue(null);
    await expect(prepareMvpTrade(route)).rejects.toThrow('Unable to price');
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

  it.each(['buy', 'buyBonk', 'sell', 'solToBase'] as const)(
    'keeps an accepted %s pending when a separate status request fails',
    async route => {
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
    }
  );

  it.each(['buy', 'buyBonk', 'sell', 'solToBase'] as const)(
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

describe('normal swap UI SDK entry points', () => {
  it.each(['sol', 'usdc', 'bonk'] as const)('prepares a variable Base ETH amount to %s and uses the EVM signer', async output => {
    const trade = await prepareSwapTrade(SWAP_ASSETS['base-eth'], SWAP_ASSETS[output], '0.000123');
    expect(mocks.prepare).toHaveBeenCalledWith(
      expect.objectContaining({
        account: wallet.address,
        gasless: true,
        sponsorship: 'required',
        source: { asset: SWAP_ASSETS['base-eth'].asset, amount: { kind: 'exact-input', input: 123000000000000n } },
        destination: { asset: SWAP_ASSETS[output].asset, recipient: account.address },
      })
    );
    await executeMvpTrade(trade);
    expect(mocks.execute.mock.calls[0][0]).toBe(trade.prepared);
    expect(mocks.execute.mock.calls[0][1].signer).toBe(wallet);
  });
  it('rejects an unfunded Base buy before preparing or unlocking', async () => {
    mocks.baseBalance.mockResolvedValue(1n);
    await expect(prepareSwapTrade(SWAP_ASSETS['base-eth'], SWAP_ASSETS['bonk'], '0.001')).rejects.toThrow('Insufficient Base ETH');
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(loadWallet).not.toHaveBeenCalled();
  });
  it('rechecks Base funds after unlock and never submits when the balance was spent', async () => {
    const trade = await prepareSwapTrade(SWAP_ASSETS['base-eth'], SWAP_ASSETS['bonk'], '0.001');
    mocks.baseBalance.mockResolvedValue(1n);
    await expect(executeMvpTrade(trade)).rejects.toThrow('Insufficient Base ETH');
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(useSolanaMvpExecutionStore.getState().attempt).toBeNull();
  });
  it('requires SOL fee reserve for native and token sources', async () => {
    mocks.balance.mockResolvedValue({ value: 999999n });
    await expect(prepareSwapTrade(SWAP_ASSETS['bonk'], SWAP_ASSETS['usdc'], '1')).rejects.toThrow('0.001 SOL');
    mocks.balance.mockResolvedValue({ value: 1000001n });
    await expect(prepareSwapTrade(SWAP_ASSETS['sol'], SWAP_ASSETS['bonk'], '0.001')).rejects.toThrow('0.001 SOL');
    expect(mocks.prepare).not.toHaveBeenCalled();
  });
  it('blocks identity swaps, excessive precision, and token amounts above the balance', async () => {
    await expect(prepareSwapTrade(SWAP_ASSETS['sol'], SWAP_ASSETS['sol'], '1')).rejects.toThrow('different tokens');
    await expect(prepareSwapTrade(SWAP_ASSETS['bonk'], SWAP_ASSETS['sol'], '1.123456')).rejects.toThrow('valid token amount');
    await expect(prepareSwapTrade(SWAP_ASSETS['bonk'], SWAP_ASSETS['sol'], '9999999')).rejects.toThrow('Insufficient BONK');
    expect(mocks.prepare).not.toHaveBeenCalled();
  });
  it('rejects a quote if the account changes during preparation', async () => {
    mocks.prepare.mockImplementationOnce(async () => {
      vi.mocked(assertSolanaSource).mockImplementation(() => {
        throw new Error('account changed');
      });
      return {};
    });
    await expect(prepareSwapTrade(SWAP_ASSETS['base-eth'], SWAP_ASSETS['bonk'], '0.001')).rejects.toThrow('account changed');
    expect(loadWallet).not.toHaveBeenCalled();
  });
  it('uses the Solana signer and validates the actual fee before signing the reviewed message', async () => {
    const sign = vi.fn().mockResolvedValue(new Uint8Array(64));
    vi.mocked(withSolanaSigner).mockImplementation(async (_account, operation) =>
      operation({ address: address(account.address), signTransactionMessage: sign })
    );
    mocks.execute.mockImplementation(async (_prepared, client) =>
      client.signer.signTransactionMessage({ cluster: 'mainnet', messageBytes: new Uint8Array([1, 2, 3]) })
    );
    const trade = await prepareSwapTrade(SWAP_ASSETS['sol'], SWAP_ASSETS['bonk'], '0.001');
    expect(mocks.prepare.mock.calls[0][0].gasless).toBeUndefined();
    await executeMvpTrade(trade);
    expect(mocks.fee).toHaveBeenCalledTimes(2);
    expect(mocks.feeRequest).toHaveBeenNthCalledWith(1, 'AQID', { commitment: 'confirmed' });
    expect(mocks.feeRequest).toHaveBeenNthCalledWith(2, 'AQID', { commitment: 'confirmed' });
    expect(sign).toHaveBeenCalledOnce();
    expect(loadWallet).not.toHaveBeenCalled();
  });
  it('does not sign when the actual fee exceeds the remaining SOL, and releases the unsigned attempt', async () => {
    const sign = vi.fn();
    vi.mocked(withSolanaSigner).mockImplementation(async (_account, operation) =>
      operation({ address: address(account.address), signTransactionMessage: sign })
    );
    mocks.fee.mockResolvedValue({ value: 99999999n });
    mocks.execute.mockImplementation(async (_prepared, client) =>
      client.signer.signTransactionMessage({ cluster: 'mainnet', messageBytes: new Uint8Array([1]) })
    );
    const trade = await prepareSwapTrade(SWAP_ASSETS['sol'], SWAP_ASSETS['bonk'], '0.001');
    await expect(executeMvpTrade(trade)).rejects.toThrow('Insufficient SOL');
    expect(sign).not.toHaveBeenCalled();
    expect(useSolanaMvpExecutionStore.getState().attempt).toBeNull();
  });
  it('retains uncertain submissions after a Solana signature leaves the signer', async () => {
    const sign = vi.fn().mockResolvedValue(new Uint8Array(64));
    vi.mocked(withSolanaSigner).mockImplementation(async (_account, operation) =>
      operation({ address: address(account.address), signTransactionMessage: sign })
    );
    mocks.execute.mockImplementation(async (_prepared, client) => {
      await client.signer.signTransactionMessage({ cluster: 'mainnet', messageBytes: new Uint8Array([1]) });
      throw new Error('network unavailable');
    });
    const trade = await prepareSwapTrade(SWAP_ASSETS['sol'], SWAP_ASSETS['bonk'], '0.001');
    await expect(executeMvpTrade(trade)).rejects.toThrow('network unavailable');
    expect(useSolanaMvpExecutionStore.getState().attempt?.status).toBe('SUBMISSION_UNCERTAIN');
    await expect(prepareSwapTrade(SWAP_ASSETS['base-eth'], SWAP_ASSETS['bonk'], '0.001')).rejects.toThrow('previous execution');
  });
});

it.each([
  ['sol', 'usdc'],
  ['sol', 'bonk'],
  ['usdc', 'sol'],
  ['usdc', 'bonk'],
  ['bonk', 'sol'],
  ['bonk', 'usdc'],
] as const)('prepares the distinct Solana pair %s → %s with the correct mint and decimals', async (input, output) => {
  if (input === 'usdc')
    mocks.send.mockResolvedValue({
      value: [
        {
          account: {
            data: {
              parsed: {
                info: {
                  owner: account.address,
                  mint: SOLANA_USDC,
                  tokenAmount: { amount: '5000000' },
                },
              },
            },
          },
        },
      ],
    });
  const amount = input === 'sol' ? '0.001' : '1';
  const trade = await prepareSwapTrade(SWAP_ASSETS[input], SWAP_ASSETS[output], amount);
  expect(mocks.prepare).toHaveBeenCalledWith(
    expect.objectContaining({
      account: account.address,
      source: { asset: SWAP_ASSETS[input].asset, amount: { kind: 'exact-input', input: trade.input } },
      destination: { asset: SWAP_ASSETS[output].asset, recipient: account.address },
      sponsorship: 'required',
    })
  );
  expect(mocks.prepare.mock.calls[0][0].gasless).toBeUndefined();
});

it('estimates the reviewed Solana message fee, ignoring the sponsored provider subtotal', async () => {
  mocks.fee.mockResolvedValueOnce({ value: 15000n }).mockResolvedValueOnce({ value: 25000n });
  const first = await prepareSwapTrade(SWAP_ASSETS['bonk'], SWAP_ASSETS['sol'], '100000');
  const second = await prepareSwapTrade(SWAP_ASSETS['bonk'], SWAP_ASSETS['sol'], '100000');
  expect(first.networkFeeLamports).toBe(15000n);
  expect(second.networkFeeLamports).toBe(25000n);
  expect(withSolanaSigner).not.toHaveBeenCalled();
  expect(mocks.execute).not.toHaveBeenCalled();
});

it('reports zero user-paid network fees for the required gasless Base route without a Solana fee RPC', async () => {
  const trade = await prepareSwapTrade(SWAP_ASSETS['base-eth'], SWAP_ASSETS['sol'], '0.001');
  expect(trade.networkFeeLamports).toBe(0n);
  expect(mocks.fee).not.toHaveBeenCalled();
});

it.each([null, new Error('RPC unavailable')])('does not offer a Solana review with an unknown fee: %s', async value => {
  if (value instanceof Error) mocks.fee.mockRejectedValueOnce(value);
  else mocks.fee.mockResolvedValueOnce({ value });
  await expect(prepareSwapTrade(SWAP_ASSETS['bonk'], SWAP_ASSETS['sol'], '100000')).rejects.toThrow();
  expect(withSolanaSigner).not.toHaveBeenCalled();
  expect(mocks.execute).not.toHaveBeenCalled();
});

it('buys an arbitrary search result using its mint and precision, then sells it through the same signer path', async () => {
  const mint = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
  const [asset] = parseSolanaSearchResults({
    sections: [
      {
        type: 'SECTION_TYPE_TOKENS',
        items: [
          {
            id: mint,
            token: { name: 'Jupiter', symbol: 'JUP', instances: [{ assetId: `${SOLANA_MAINNET_CHAIN}/token:${mint}`, decimals: 6 }] },
          },
        ],
      },
    ],
  });
  const buy = await prepareSwapTrade(SWAP_ASSETS['base-eth'], asset, '0.001');
  expect(mocks.prepare.mock.calls[0][0].destination).toEqual({ asset: solanaToken(address(mint)), recipient: account.address });
  await executeMvpTrade(buy);
  expect(mocks.execute.mock.calls[0][0]).toBe(buy.prepared);
  useSolanaMvpExecutionStore.setState({ attempt: null });

  mocks.send.mockResolvedValue({
    value: [{ account: { data: { parsed: { info: { owner: account.address, mint, tokenAmount: { amount: '1234567' } } } } } }],
  });
  const balances = await getSwapBalances(account, [asset, asset]);
  expect(balances).toEqual({ [mint]: 1234567n });
  const sell = await prepareSwapTrade(asset, SWAP_ASSETS.sol, '1.234567');
  expect(mocks.prepare.mock.lastCall?.[0].source).toEqual({
    asset: solanaToken(address(mint)),
    amount: { kind: 'exact-input', input: 1234567n },
  });
  await executeMvpTrade(sell);
  expect(withSolanaSigner).toHaveBeenCalled();
  expect(mocks.execute.mock.lastCall?.[0]).toBe(sell.prepared);
});
