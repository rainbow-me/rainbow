import { MaxUint256 } from '@ethersproject/constants';
import { OperationType, RelayerTransactionState, SafeTransaction } from '@polymarket/builder-relayer-client';
import { parseUnits } from 'ethers/lib/utils';
import { USD_DECIMALS } from '@/features/perps/constants';
import { logger, RainbowError } from '@/logger';
import { USDC_ADDRESS } from '@/references';
import { ChainId } from '@/state/backendNetworks/types';
import { createWithdrawalConfig } from '@/systems/funding/config';
import { WithdrawalExecutionResult, WithdrawalExecutorParams } from '@/systems/funding/types';
import { time } from '@/utils/time';
import { POLYGON_USDC_ADDRESS, POLYGON_USDC_DECIMALS } from './constants';
import { getPolymarketRelayClient } from './stores/derived/usePolymarketClients';
import { usePolymarketProxyAddress } from './stores/derived/usePolymarketProxyAddress';
import { usePolymarketBalanceStore } from './stores/polymarketBalanceStore';
import { awaitPolygonConfirmation } from './utils/confirmation';
import { erc20Interface } from './utils/erc20Interface';
import { ensureProxyWalletIsDeployed } from './utils/proxyWallet';
import { refetchPolymarketStores } from './utils/refetchPolymarketStores';

// ============ Config ========================================================= //

export const POLYMARKET_WITHDRAWAL_CONFIG = createWithdrawalConfig({
  id: 'polymarketWithdrawal',
  amountDecimals: USD_DECIMALS,
  balanceStore: usePolymarketBalanceStore,
  executor: executePolymarketWithdrawal,
  prerequisite: ensureProxyReady,

  route: {
    from: {
      addressStore: usePolymarketProxyAddress,
      chainId: ChainId.polygon,
      token: { address: POLYGON_USDC_ADDRESS, decimals: POLYGON_USDC_DECIMALS },
    },
    to: {
      token: {
        address: USDC_ADDRESS,
        chainId: ChainId.mainnet,
        symbol: 'USDC',
      },
      defaultChain: ChainId.base,
      persistSelectedChain: true,
    },
    quote: {
      feeBps: 0,
      slippage: 1,
    },
  },

  refresh: {
    delays: [time.seconds(1), time.seconds(3), time.seconds(6)],
    handler: refetchPolymarketStores,
  },
});

// ============ Prerequisite =================================================== //

async function ensureProxyReady(): Promise<void> {
  const proxyAddress = usePolymarketProxyAddress.getState();
  if (!proxyAddress) {
    throw new Error('No proxy address available');
  }
  await ensureProxyWalletIsDeployed(proxyAddress);
}

// ============ Executor ======================================================= //

async function executePolymarketWithdrawal(params: WithdrawalExecutorParams): Promise<WithdrawalExecutionResult> {
  const { amount, chainInfo, quote, recipient } = params;
  const selectedChainId = chainInfo?.chainId;
  const isCrossChainSelection = selectedChainId !== undefined && selectedChainId !== ChainId.polygon;

  if (isCrossChainSelection && !quote) {
    return { error: 'Missing quote for cross-chain withdrawal', success: false };
  }

  if (quote) return executeQuotedWithdrawal(quote);

  return executeSameChainWithdrawal(amount, recipient);
}

// ============ Same-Chain Withdrawal ========================================== //

async function executeSameChainWithdrawal(amount: string, recipient: string): Promise<WithdrawalExecutionResult> {
  try {
    const client = await getPolymarketRelayClient();
    const data = erc20Interface.encodeFunctionData('transfer', [recipient, parseUnits(amount, POLYGON_USDC_DECIMALS)]);
    const tx: SafeTransaction = {
      data,
      operation: OperationType.Call,
      to: POLYGON_USDC_ADDRESS,
      value: '0',
    };

    const response = await client.execute([tx], 'Withdraw USDC to wallet');

    if (response.state === RelayerTransactionState.STATE_FAILED || response.state === RelayerTransactionState.STATE_INVALID) {
      return { error: `Relayer rejected: ${response.state}`, success: false };
    }

    const hash = response.transactionHash;
    if (!hash) {
      return { error: 'Relayer did not return transaction hash', success: false };
    }

    return {
      success: true,
      waitForConfirmation: () => awaitPolygonConfirmation(hash),
    };
  } catch (error) {
    return handleExecutorError(error, 'same-chain');
  }
}

// ============ Quoted Withdrawal ============================================== //

async function executeQuotedWithdrawal(quote: NonNullable<WithdrawalExecutorParams['quote']>): Promise<WithdrawalExecutionResult> {
  if (!quote.data || !quote.to) {
    return { error: 'No valid quote for quoted withdrawal', success: false };
  }

  try {
    const client = await getPolymarketRelayClient();
    const transactions: SafeTransaction[] = [];

    if (quote.allowanceNeeded && quote.allowanceTarget) {
      transactions.push({
        data: erc20Interface.encodeFunctionData('approve', [quote.allowanceTarget, MaxUint256]),
        operation: OperationType.Call,
        to: POLYGON_USDC_ADDRESS,
        value: '0',
      });
    }

    transactions.push({
      data: quote.data,
      operation: OperationType.Call,
      to: quote.to,
      value: quote.value?.toString() ?? '0',
    });

    const response = await client.execute(transactions, 'Withdrawal via swaps');

    if (response.state === RelayerTransactionState.STATE_FAILED || response.state === RelayerTransactionState.STATE_INVALID) {
      return { error: `Relayer rejected: ${response.state}`, success: false };
    }

    const hash = response.transactionHash;
    if (!hash) {
      return { error: 'Relayer did not return transaction hash', success: false };
    }

    return {
      success: true,
      waitForConfirmation: () => awaitPolygonConfirmation(hash),
    };
  } catch (error) {
    return handleExecutorError(error, 'quoted');
  }
}

// ============ Helpers ======================================================== //

function handleExecutorError(error: unknown, context: string): WithdrawalExecutionResult {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error(new RainbowError(`[polymarketWithdrawal]: ${context} failed`), { error });
  return { error: message, success: false };
}
