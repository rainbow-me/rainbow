import { Wallet } from '@ethersproject/wallet';
import { address, type Address } from '@solana/addresses';
import { createSolanaRpc } from '@solana/rpc';
import { createBaseStore } from '@storesjs/stores';
import { getAddress } from 'viem';

import { createDelegationPublicClient } from '@/features/delegation/utils/calls';
import { ChainId } from '@/features/network/types/backendNetworks';
import {
  BASE_USDC,
  BONK,
  BUY_AMOUNT,
  sellAmount,
  SOLANA_USDC,
  solanaToken,
  validateMvpReview,
  type MvpRoute,
} from '@/features/solana/core/mvpRoutes';
import { configureSolanaMvpSdk } from '@/features/solana/data/mvpSdk';
import { assertSolanaSource, requireEnabledSolanaAccount } from '@/features/wallet/data/enableSolanaAccount';
import { withSolanaSigner } from '@/features/wallet/data/loadSolanaSigner';
import { loadWallet } from '@/features/wallet/data/loadWallet';
import { getSolanaAccount, type EnabledSolanaAccount } from '@/features/wallet/data/stores/accountMetadataStore';
import { getProvider } from '@/handlers/web3';
import {
  execute,
  isTerminalStatus,
  type ExecutionStatus,
  type PreparedRouteExecution,
  type RelayExecutionId,
} from '@rainbow-me/solana-sdk';

// shortcut: public mainnet RPC for the internal harness; use Rainbow's Solana RPC before wider rollout.
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');

type Attempt = { executionId: RelayExecutionId; account: EnabledSolanaAccount; route: MvpRoute; status: string };
export const useSolanaMvpExecutionStore = createBaseStore<{ attempt: Attempt | null }>(() => ({ attempt: null }), {
  storageKey: 'solanaMvpExecution',
  version: 1,
});

type ReviewContext = { account: EnabledSolanaAccount; input: bigint };
export type MvpTrade = ReviewContext &
  ({ route: 'buy'; prepared: PreparedRouteExecution<'evm'> } | { route: 'sell'; prepared: PreparedRouteExecution<'solana'> });

function assertAccount(account: EnabledSolanaAccount): void {
  assertSolanaSource(account);
  if (getSolanaAccount(account.walletId, account.index)?.address !== account.address)
    throw new Error('Enable Solana again for this account.');
}

function assertNoPendingAttempt(): void {
  const attempt = useSolanaMvpExecutionStore.getState().attempt;
  if (attempt && !isTerminalStatus(attempt.status)) throw new Error('Check the previous execution status before starting another swap.');
}

async function tokenBalance(owner: string, mint: Address): Promise<bigint> {
  const result = await rpc.getTokenAccountsByOwner(address(owner), { mint }, { encoding: 'jsonParsed', commitment: 'confirmed' }).send();
  return result.value.reduce((total, item) => {
    const data = item.account.data;
    if (!('parsed' in data)) throw new Error('Unable to read token balance.');
    const info = data.parsed.info;
    if (info.owner !== owner || info.mint !== mint || !/^\d+$/.test(info.tokenAmount.amount))
      throw new Error('Invalid token balance response.');
    return total + BigInt(info.tokenAmount.amount);
  }, 0n);
}

export async function getMvpBalances() {
  const account = requireEnabledSolanaAccount();
  const [bonk, usdc] = await Promise.all([tokenBalance(account.address, BONK), tokenBalance(account.address, SOLANA_USDC)]);
  assertAccount(account);
  return { address: account.address, bonk, usdc };
}

export async function prepareMvpTrade(route: MvpRoute): Promise<MvpTrade> {
  const account = requireEnabledSolanaAccount();
  assertNoPendingAttempt();
  configureSolanaMvpSdk();
  let trade: MvpTrade;
  if (route === 'buy') {
    const prepared = await execute.prepare.route({
      account: getAddress(account.sourceEvmAddress),
      publicClient: createDelegationPublicClient(ChainId.base),
      source: {
        asset: { location: 'evm', kind: 'erc20', chainId: ChainId.base, address: BASE_USDC },
        amount: { kind: 'exact-input', input: BUY_AMOUNT },
      },
      destination: { asset: solanaToken(BONK), recipient: address(account.address) },
      gasless: true,
      sponsorship: 'required',
    });
    trade = { route, account, input: BUY_AMOUNT, prepared };
  } else {
    const input = sellAmount(await tokenBalance(account.address, BONK));
    assertAccount(account);
    const prepared = await execute.prepare.route({
      account: address(account.address),
      source: { asset: solanaToken(BONK), amount: { kind: 'exact-input', input } },
      destination: { asset: solanaToken(SOLANA_USDC), recipient: address(account.address) },
      gasless: true,
      sponsorship: 'required',
    });
    trade = { route, account, input, prepared };
  }
  assertAccount(account);
  validateMvpReview(route, trade.input, trade.prepared);
  return trade;
}

let executing = false;
const submitted = new WeakSet<PreparedRouteExecution>();

/** The exact opaque prepared object reviewed by the user is submitted once. */
export async function executeMvpTrade(trade: MvpTrade): Promise<void> {
  if (executing) throw new Error('A swap is already executing.');
  if (submitted.has(trade.prepared)) throw new Error('This execution was already submitted. Check its status.');
  assertAccount(trade.account);
  assertNoPendingAttempt();
  validateMvpReview(trade.route, trade.input, trade.prepared);
  executing = true;
  const begin = () => {
    assertAccount(trade.account);
    validateMvpReview(trade.route, trade.input, trade.prepared);
    submitted.add(trade.prepared);
    useSolanaMvpExecutionStore.setState({
      attempt: {
        executionId: trade.prepared.executionId,
        account: trade.account,
        route: trade.route,
        status: 'SUBMISSION_UNCERTAIN',
      },
    });
  };
  try {
    if (trade.route === 'buy') {
      const provider = getProvider({ chainId: ChainId.base });
      const signer = await loadWallet({ address: trade.account.sourceEvmAddress, provider });
      if (!(signer instanceof Wallet) || signer.address.toLowerCase() !== trade.account.sourceEvmAddress.toLowerCase()) {
        throw new Error('Unable to unlock the selected EVM account.');
      }
      begin();
      await execute.route(trade.prepared, { signer, provider, chainId: ChainId.base });
    } else {
      await withSolanaSigner(trade.account, async signer => {
        begin();
        await execute.route(trade.prepared, { rpc, signer });
      });
    }
    await checkMvpExecution();
  } finally {
    // Keep the execution ID after ambiguous failures; a new quote could spend twice.
    // eslint-disable-next-line require-atomic-updates -- only the operation holding this lock reaches finally
    executing = false;
  }
}

export async function checkMvpExecution(): Promise<ExecutionStatus> {
  configureSolanaMvpSdk();
  const attempt = useSolanaMvpExecutionStore.getState().attempt;
  if (!attempt) throw new Error('No test execution to check.');
  const status = await execute.status({ executionId: attempt.executionId });
  if (status.executionId !== attempt.executionId) throw new Error('Execution status identity mismatch.');
  if (useSolanaMvpExecutionStore.getState().attempt?.executionId === attempt.executionId) {
    useSolanaMvpExecutionStore.setState({ attempt: { ...attempt, status: status.status } });
  }
  return status;
}
