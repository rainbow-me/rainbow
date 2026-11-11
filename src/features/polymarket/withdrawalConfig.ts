import { OperationType, type SafeTransaction } from '@polymarket/builder-relayer-client';
import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { getAddress, type Address } from 'viem';

import { analytics } from '@/analytics';
import { USD_DECIMALS } from '@/features/currency/constants';
import { ChainId } from '@/features/network/types/backendNetworks';
import { encodeErc20Transfer } from '@/features/token/core/services/erc20Calldata';
import { logger, RainbowError } from '@/logger';
import { USDC_ADDRESS } from '@/references/constants';
import { createWithdrawalConfig } from '@/systems/funding/config';
import { type WithdrawalExecutionResult, type WithdrawalExecutorParams, type WithdrawalSwapQuote } from '@/systems/funding/types';

import { POLYGON_USDC_ADDRESS, POLYGON_USDC_DECIMALS } from './constants';
import { getPolymarketWallet } from './stores/derived/usePolymarketClients';
import { usePolymarketProxyAddress } from './stores/derived/usePolymarketProxyAddress';
import { usePolymarketBalanceStore } from './stores/polymarketBalanceStore';
import { buildEnsureUsdcBalanceTransactions } from './utils/collateral';
import { buildErc20ApprovalTransaction } from './utils/erc20Approval';
import { refetchPolymarketBalance } from './utils/refetchPolymarketStores';
import { waitForRelayerTransaction } from './utils/relayExecution';

// ============ Config ========================================================= //

export const POLYMARKET_WITHDRAWAL_CONFIG = createWithdrawalConfig({
  id: 'polymarketWithdrawal',
  amountDecimals: USD_DECIMALS,
  balanceStore: usePolymarketBalanceStore,
  executor: executePolymarketWithdrawal,

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
      enableSameChainSwap: true,
      persistSelectedChain: true,
    },
    quote: {
      feeBps: 0,
      slippage: 1,
    },
  },

  trackFailure: metadata => analytics.track(analytics.event.predictionsWithdrawalFailed, metadata),
  trackSuccess: metadata => analytics.track(analytics.event.predictionsWithdrawal, metadata),
});

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

async function executeSameChainWithdrawal(amount: string, recipient: Address): Promise<WithdrawalExecutionResult> {
  try {
    const wallet = await getPolymarketWallet();
    const proxyAddress = wallet.address;

    const rawAmount = parseUnits(amount, POLYGON_USDC_DECIMALS);
    const transactions: SafeTransaction[] = [
      ...(await buildEnsureUsdcBalanceTransactions({ amount: rawAmount, proxyAddress })),
      buildUsdcTransferTransaction({ amount: rawAmount, recipient }),
    ];
    const response = await wallet.execute(transactions, 'Withdraw USDC.e to wallet');

    return {
      success: true,
      waitForConfirmation: async () => {
        await waitForRelayerTransaction(response, 'Withdraw USDC.e to wallet');
        await refetchPolymarketBalance(proxyAddress);
      },
    };
  } catch (error) {
    return handleExecutorError(error, 'same-chain');
  }
}

// ============ Quoted Withdrawal ============================================== //

async function executeQuotedWithdrawal(quote: WithdrawalSwapQuote): Promise<WithdrawalExecutionResult> {
  if (!quote.data || !quote.to) {
    return { error: 'No valid quote for quoted withdrawal', success: false };
  }

  try {
    const wallet = await getPolymarketWallet(getAddress(quote.from));
    const proxyAddress = wallet.address;

    const sellAmount = BigNumber.from(quote.sellAmount);
    const transactions: SafeTransaction[] = await buildEnsureUsdcBalanceTransactions({ amount: sellAmount, proxyAddress });

    const allowanceTarget = quote.allowanceNeeded && quote.allowanceTarget ? getAddress(quote.allowanceTarget) : null;
    if (allowanceTarget) {
      transactions.push(buildErc20ApprovalTransaction({ spender: allowanceTarget, tokenAddress: POLYGON_USDC_ADDRESS }));
    }

    transactions.push({
      data: quote.data,
      operation: OperationType.Call,
      to: quote.to,
      value: quote.value?.toString() ?? '0',
    });

    const response = await wallet.execute(transactions, 'Withdrawal via swaps');

    return {
      success: true,
      waitForConfirmation: async () => {
        await waitForRelayerTransaction(response, 'Withdrawal via swaps');
        await refetchPolymarketBalance(proxyAddress);
      },
    };
  } catch (error) {
    return handleExecutorError(error, 'quoted');
  }
}

// ============ Helpers ======================================================== //

function buildUsdcTransferTransaction({ amount, recipient }: { amount: BigNumber; recipient: Address }): SafeTransaction {
  return {
    data: encodeErc20Transfer({ amount, to: recipient }),
    operation: OperationType.Call,
    to: POLYGON_USDC_ADDRESS,
    value: '0',
  };
}

function handleExecutorError(error: unknown, context: string): WithdrawalExecutionResult {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error(new RainbowError(`[polymarketWithdrawal]: ${context} failed`), { error });
  return { error: message, success: false };
}
