import { Wallet } from '@ethersproject/wallet';
import { address, type Address } from '@solana/addresses';
import { getBase64Decoder } from '@solana/codecs-strings';
import { createSolanaRpc } from '@solana/rpc';
import { type TransactionMessageBytesBase64 } from '@solana/transactions';
import { createBaseStore } from '@storesjs/stores';
import { getAddress } from 'viem';

import { createDelegationPublicClient } from '@/features/delegation/utils/calls';
import { ChainId } from '@/features/network/types/backendNetworks';
import {
  BASE_USDC,
  BONK,
  buyAmount,
  sellAmount,
  SOL,
  SOL_TO_BASE_AMOUNT,
  SOLANA_USDC,
  solanaToken,
  validateMvpReview,
  type MvpRoute,
} from '@/features/solana/core/mvpRoutes';
import { SOL_FEE_RESERVE, swapInputAmount, validateSwapReview, type SolanaSwapAsset, type SwapAsset } from '@/features/solana/core/swap';
import { configureSolanaMvpSdk, takeSolanaRouteMessage } from '@/features/solana/data/mvpSdk';
import { type PreparedSwap } from '@/features/solana/data/swapTypes';
import { assertSolanaSource, getEnabledSolanaAccount } from '@/features/wallet/data/enableSolanaAccount';
import { withSolanaSigner } from '@/features/wallet/data/loadSolanaSigner';
import { loadWallet } from '@/features/wallet/data/loadWallet';
import { getSolanaAccount, type EnabledSolanaAccount } from '@/features/wallet/data/stores/accountMetadataStore';
import { getProvider } from '@/handlers/web3';
import { ETH_ADDRESS } from '@/references/constants';
import { fetchExternalToken } from '@/resources/assets/externalAssetsQuery';
import {
  execute,
  isTerminalStatus,
  ManagedExecutionFailedError,
  RelayExecutionStatus,
  type ExecutionStatus,
  type PreparedRouteExecution,
  type RelayExecutionId,
} from '@rainbow-me/solana-sdk';

// shortcut: public mainnet RPC for the internal harness; use Rainbow's Solana RPC before wider rollout.
const rpc = createSolanaRpc('https://api.mainnet-beta.solana.com');

type Attempt = { executionId: RelayExecutionId; account: EnabledSolanaAccount; route: MvpRoute | 'swap'; status: string };
export const useSolanaMvpExecutionStore = createBaseStore<{ attempt: Attempt | null }>(() => ({ attempt: null }), {
  storageKey: 'solanaMvpExecution',
  version: 1,
});

type ReviewContext = { account: EnabledSolanaAccount; input: bigint };
export type MvpTrade = ReviewContext &
  (
    | { route: 'buy'; prepared: PreparedRouteExecution<'evm'> }
    | { route: 'buyBonk'; prepared: PreparedRouteExecution<'evm'> }
    | { route: 'sell' | 'solToBase'; prepared: PreparedRouteExecution<'solana'> }
  );

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
  const account = getEnabledSolanaAccount();
  const [bonk, usdc, sol] = await Promise.all([
    tokenBalance(account.address, BONK),
    tokenBalance(account.address, SOLANA_USDC),
    rpc.getBalance(address(account.address), { commitment: 'confirmed' }).send(),
  ]);
  assertAccount(account);
  return { address: account.address, bonk, usdc, sol: sol.value };
}

export async function prepareMvpTrade(route: MvpRoute): Promise<MvpTrade> {
  const account = getEnabledSolanaAccount();
  assertNoPendingAttempt();
  configureSolanaMvpSdk();
  let trade: MvpTrade;
  if (route === 'buy' || route === 'buyBonk') {
    const eth = await fetchExternalToken({ address: ETH_ADDRESS, chainId: ChainId.mainnet, currency: 'USD' });
    const input = buyAmount(eth?.price?.value);
    assertAccount(account);
    const prepared = await execute.prepare.route({
      account: getAddress(account.sourceEvmAddress),
      publicClient: createDelegationPublicClient(ChainId.base),
      source: {
        asset: { location: 'evm', kind: 'native', chainId: ChainId.base },
        amount: { kind: 'exact-input', input },
      },
      destination: { asset: route === 'buyBonk' ? solanaToken(BONK) : SOL, recipient: address(account.address) },
      gasless: true,
      sponsorship: 'required',
    });
    trade = { route, account, input, prepared };
  } else {
    const input = route === 'solToBase' ? SOL_TO_BASE_AMOUNT : sellAmount(await tokenBalance(account.address, BONK));
    const solBalance = (await rpc.getBalance(address(account.address), { commitment: 'confirmed' }).send()).value;
    if (solBalance <= (route === 'solToBase' ? input : 0n))
      throw new Error('This test requires SOL for network fees in addition to the swap amount.');
    assertAccount(account);
    const prepared = await execute.prepare.route({
      account: address(account.address),
      source: { asset: route === 'solToBase' ? SOL : solanaToken(BONK), amount: { kind: 'exact-input', input } },
      destination:
        route === 'solToBase'
          ? { asset: BASE_USDC, recipient: getAddress(account.sourceEvmAddress) }
          : { asset: solanaToken(SOLANA_USDC), recipient: address(account.address) },
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
function validateTrade(trade: MvpTrade | PreparedSwap): void {
  if (trade.route === 'swap') validateSwapReview(trade);
  else validateMvpReview(trade.route, trade.input, trade.prepared);
}

export async function executeMvpTrade(trade: MvpTrade | PreparedSwap): Promise<void> {
  if (executing) throw new Error('A swap is already executing.');
  if (submitted.has(trade.prepared)) throw new Error('This execution was already submitted. Check its status.');
  assertAccount(trade.account);
  assertNoPendingAttempt();
  validateTrade(trade);
  executing = true;
  let signatureProduced = false;
  const begin = () => {
    assertAccount(trade.account);
    validateTrade(trade);
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
  const setSubmissionStatus = (status: RelayExecutionStatus) => {
    useSolanaMvpExecutionStore.setState(state =>
      state.attempt?.executionId === trade.prepared.executionId && !isTerminalStatus(state.attempt.status)
        ? { attempt: { ...state.attempt, status } }
        : state
    );
  };
  try {
    if (trade.route === 'buy' || trade.route === 'buyBonk' || (trade.route === 'swap' && trade.sourceChain === 'evm')) {
      const provider = getProvider({ chainId: ChainId.base });
      const signer = await loadWallet({ address: trade.account.sourceEvmAddress, provider });
      if (!(signer instanceof Wallet) || signer.address.toLowerCase() !== trade.account.sourceEvmAddress.toLowerCase()) {
        throw new Error('Unable to unlock the selected EVM account.');
      }
      if (trade.route === 'swap') await assertSwapFunds(trade.account, trade.inputAsset, trade.input);
      begin();
      await execute.route(trade.prepared, { signer, provider, chainId: ChainId.base });
    } else {
      await withSolanaSigner(trade.account, async signer => {
        begin();
        await execute.route(trade.prepared, {
          rpc,
          signer:
            trade.route !== 'swap'
              ? signer
              : {
                  ...signer,
                  signTransactionMessage: async request => {
                    validateSwapReview(trade);
                    await assertSwapFunds(trade.account, trade.inputAsset, trade.input);
                    const message = getBase64Decoder().decode(request.messageBytes) as TransactionMessageBytesBase64;
                    const [fee, balance] = await Promise.all([
                      rpc.getFeeForMessage(message, { commitment: 'confirmed' }).send(),
                      rpc.getBalance(address(trade.account.address), { commitment: 'confirmed' }).send(),
                    ]);
                    if (fee.value === null) throw new Error('Unable to estimate the Solana network fee. Review a fresh quote.');
                    if (balance.value < fee.value + (trade.inputAsset.asset.kind === 'native' ? trade.input : 0n))
                      throw new Error('Insufficient SOL for the swap and network fee.');
                    assertAccount(trade.account);
                    validateSwapReview(trade);
                    const signature = await signer.signTransactionMessage(request);
                    signatureProduced = true;
                    return signature;
                  },
                },
        });
      });
    }
    // SDK resolution means submission was accepted; confirmation is checked separately.
    setSubmissionStatus(RelayExecutionStatus.Pending);
  } catch (error) {
    if (error instanceof ManagedExecutionFailedError && error.executionId === trade.prepared.executionId) {
      setSubmissionStatus(RelayExecutionStatus.Failed);
    } else if (trade.route === 'swap' && trade.sourceChain !== 'evm' && !signatureProduced) {
      // No signature left the signer, so this attempt cannot have funded a source transaction.
      useSolanaMvpExecutionStore.setState(state => (state.attempt?.executionId === trade.prepared.executionId ? { attempt: null } : state));
    }
    throw error;
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

export async function getSwapBalances(account: EnabledSolanaAccount, assets: readonly SwapAsset[]): Promise<Record<string, bigint>> {
  assertAccount(account);
  const uniqueAssets = [...new Map(assets.map(asset => [asset.id, asset])).values()];
  const balances = await Promise.all(
    uniqueAssets.map(async asset => {
      const balance =
        asset.chain === 'evm'
          ? BigInt((await getProvider({ chainId: ChainId.base }).getBalance(account.sourceEvmAddress)).toString())
          : asset.asset.kind === 'native'
            ? (await rpc.getBalance(address(account.address), { commitment: 'confirmed' }).send()).value
            : await tokenBalance(account.address, asset.asset.address);
      return [asset.id, balance] as const;
    })
  );
  assertAccount(account);
  return Object.fromEntries(balances);
}

async function assertSwapFunds(account: EnabledSolanaAccount, asset: SwapAsset, amount: bigint): Promise<void> {
  assertAccount(account);
  if (asset.chain === 'evm') {
    const balance = await getProvider({ chainId: ChainId.base }).getBalance(account.sourceEvmAddress);
    if (BigInt(balance.toString()) < amount) throw new Error('Insufficient Base ETH for this swap.');
  } else {
    const sol = (await rpc.getBalance(address(account.address), { commitment: 'confirmed' }).send()).value;
    const balance = asset.asset.kind === 'native' ? sol : await tokenBalance(account.address, asset.asset.address);
    if (balance < amount) throw new Error(`Insufficient ${asset.symbol} for this swap.`);
    if (sol < SOL_FEE_RESERVE + (asset.asset.kind === 'native' ? amount : 0n))
      throw new Error('Keep at least 0.001 SOL available for network fees.');
  }
  assertAccount(account);
}

export async function prepareSwapTrade(inputAsset: SwapAsset, outputAsset: SolanaSwapAsset, amount: string): Promise<PreparedSwap> {
  const account = getEnabledSolanaAccount();
  if (inputAsset.id === outputAsset.id) throw new Error('Select two different tokens.');
  const input = swapInputAmount(amount, inputAsset);
  assertNoPendingAttempt();
  configureSolanaMvpSdk();
  await assertSwapFunds(account, inputAsset, input);
  const destination = { asset: outputAsset.asset, recipient: address(account.address) };
  let trade: PreparedSwap;
  if (inputAsset.chain === 'evm') {
    const prepared = await execute.prepare.route({
      account: getAddress(account.sourceEvmAddress),
      publicClient: createDelegationPublicClient(ChainId.base),
      source: { asset: inputAsset.asset, amount: { kind: 'exact-input', input } },
      destination,
      gasless: true,
      sponsorship: 'required',
    });
    trade = { route: 'swap', sourceChain: 'evm', account, inputAsset, outputAsset, input, prepared, networkFeeLamports: 0n };
  } else {
    const prepared = await execute.prepare.route({
      account: address(account.address),
      source: { asset: inputAsset.asset, amount: { kind: 'exact-input', input } },
      destination,
      sponsorship: 'required',
    });
    const message = takeSolanaRouteMessage(prepared.executionId);
    const fee = await rpc.getFeeForMessage(message, { commitment: 'confirmed' }).send();
    if (fee.value === null) throw new Error('Unable to estimate the Solana network fee. Review a fresh quote.');
    trade = { route: 'swap', sourceChain: 'solana', account, inputAsset, outputAsset, input, prepared, networkFeeLamports: fee.value };
  }
  assertAccount(account);
  assertNoPendingAttempt();
  validateSwapReview(trade);
  return trade;
}
