import {
  OperationType,
  RelayerTransactionState,
  type RelayClient,
  type RelayerTransaction,
  type RelayerTransactionResponse,
  type SafeTransaction,
} from '@polymarket/builder-relayer-client';
import { decodeFunctionResult, encodeFunctionData, erc1155Abi, maxUint256, type Address } from 'viem';

import {
  POLYMARKET_CTF_ADDRESS,
  POLYMARKET_CTF_EXCHANGE_ADDRESS,
  POLYMARKET_NEG_RISK_ADAPTER_ADDRESS,
  POLYMARKET_NEG_RISK_CTF_EXCHANGE_ADDRESS,
  POLYMARKET_PUSD_ADDRESS,
} from '@/features/polymarket/constants';
import { getPolymarketRelayClient } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { getMissingErc20ApprovalTransaction } from '@/features/polymarket/utils/erc20Approval';
import { getPolymarketWallet, type PolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { syncClobCollateralBalance } from '@/features/polymarket/utils/syncClobCollateralBalance';
import { requireHex } from '@/framework/core/evm/hex';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { ChainId } from '@rainbow-me/swaps';

import { awaitPolygonConfirmation } from './confirmation';

// ============================================================================
// Contracts
// ============================================================================

const polygonProvider = getProvider({ chainId: ChainId.polygon });

/**
 * Polymarket contracts that require broad trading approvals.
 */
const APPROVAL_TARGETS = {
  exchange: { label: 'Exchange', address: POLYMARKET_CTF_EXCHANGE_ADDRESS },
  negRiskExchange: { label: 'NegRiskExchange', address: POLYMARKET_NEG_RISK_CTF_EXCHANGE_ADDRESS },
  negRiskAdapter: { label: 'NegRiskAdapter', address: POLYMARKET_NEG_RISK_ADAPTER_ADDRESS },
};

// ============================================================================
// Approval Checks
// ============================================================================

async function hasCtfApproval(owner: Address, operator: Address): Promise<boolean> {
  const data = encodeFunctionData({
    abi: erc1155Abi,
    functionName: 'isApprovedForAll',
    args: [owner, operator],
  });
  const result = await polygonProvider.call({ to: POLYMARKET_CTF_ADDRESS, data });

  return decodeFunctionResult({
    abi: erc1155Abi,
    functionName: 'isApprovedForAll',
    data: requireHex(result, new RainbowError('[polymarket] Provider returned non-hex call data')),
  });
}

// ============================================================================
// Transaction Builders
// ============================================================================

function buildCtfApproval(operator: Address): SafeTransaction {
  return {
    to: POLYMARKET_CTF_ADDRESS,
    data: encodeFunctionData({
      abi: erc1155Abi,
      functionName: 'setApprovalForAll',
      args: [operator, true],
    }),
    value: '0',
    operation: OperationType.Call,
  };
}

// ============================================================================
// Relay Execution
// ============================================================================

export async function submitTradingWalletTransaction({
  transactions,
  description,
}: {
  transactions: SafeTransaction[];
  description: string;
}): Promise<RelayerTransactionResponse> {
  const wallet = await getPolymarketWallet();
  const client = await getPolymarketRelayClient();
  await ensureWalletDeployed(client, wallet);
  return await wallet.executeBatch({ client, transactions, description });
}

export async function ensureTradingWalletDeployed(): Promise<Address> {
  const wallet = await getPolymarketWallet();
  const client = await getPolymarketRelayClient();
  await ensureWalletDeployed(client, wallet);
  return wallet.address;
}

async function ensureWalletDeployed(client: RelayClient, wallet: PolymarketWallet): Promise<void> {
  const isDeployed = await wallet.isDeployed(client);
  if (isDeployed) return;

  const response = await wallet.deploy(client);
  await waitForRelayerTransaction(response, 'wallet deployment');
}

export async function waitForRelayerTransaction(response: RelayerTransactionResponse, description: string): Promise<RelayerTransaction> {
  assertRelayerTransactionAccepted(response, description);

  if (response.transactionHash) {
    await awaitPolygonConfirmation(response.transactionHash);
    const [transaction] = await response.getTransaction();
    if (!transaction) {
      throw new RainbowError(`[polymarket] ${description} confirmed but relayer returned no transaction`);
    }
    return transaction;
  }

  const transaction = await response.wait();
  if (!transaction) {
    throw new RainbowError(`[polymarket] ${description} did not confirm`);
  }

  if (transaction.state === RelayerTransactionState.STATE_FAILED) {
    throw new RainbowError(`[polymarket] ${description} failed`);
  }

  if (transaction.state === RelayerTransactionState.STATE_INVALID) {
    throw new RainbowError(`[polymarket] ${description} rejected as invalid`);
  }

  if (transaction.transactionHash) {
    await awaitPolygonConfirmation(transaction.transactionHash);
  }

  return transaction;
}

export async function executeRelayTransaction(transactions: SafeTransaction[], description: string): Promise<void> {
  const response = await submitTradingWalletTransaction({ transactions, description });
  await waitForRelayerTransaction(response, description);
}

function assertRelayerTransactionAccepted(response: RelayerTransactionResponse, description: string): void {
  if (response.state === RelayerTransactionState.STATE_FAILED) {
    throw new RainbowError(`[polymarket] ${description} failed`);
  }

  if (response.state === RelayerTransactionState.STATE_INVALID) {
    throw new RainbowError(`[polymarket] ${description} rejected as invalid`);
  }
}

// ============================================================================
// Core Approval Logic
// ============================================================================

/**
 * Checks all required approvals and returns transactions for any that are missing.
 */
async function getMissingApprovalTransactions(walletAddress: Address): Promise<SafeTransaction[]> {
  const ctfApprovalChecks = await Promise.all(
    Object.values(APPROVAL_TARGETS).map(({ address, label }) =>
      hasCtfApproval(walletAddress, address).then(approved => ({ address, approved, label }))
    )
  );

  const erc20ApprovalTransactions = await Promise.all(
    Object.values(APPROVAL_TARGETS).map(({ address, label }) =>
      getMissingErc20ApprovalTransaction({
        amount: maxUint256,
        owner: walletAddress,
        provider: polygonProvider,
        spender: address,
        tokenAddress: POLYMARKET_PUSD_ADDRESS,
      }).then(transactions => ({ label, transactions }))
    )
  );

  const transactions: SafeTransaction[] = [];

  for (const { transactions: approvalTransactions } of erc20ApprovalTransactions) {
    if (approvalTransactions.length > 0) {
      transactions.push(...approvalTransactions);
    }
  }

  for (const { address, approved } of ctfApprovalChecks) {
    if (!approved) {
      transactions.push(buildCtfApproval(address));
    }
  }

  return transactions;
}

export async function getMissingCtfOperatorApprovalTransactions(operator: Address): Promise<SafeTransaction[]> {
  const wallet = await getPolymarketWallet();
  if (await hasCtfApproval(wallet.address, operator)) {
    return [];
  }

  logger.debug(`[polymarket] Adding CTF operator approval for ${operator}`);
  return [buildCtfApproval(operator)];
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Ensures the active Polymarket trading wallet is deployed and has the
 * approvals it needs to trade.
 */
export async function ensureTradingApprovals(): Promise<void> {
  const walletAddress = await ensureTradingWalletDeployed();
  const transactions = await getMissingApprovalTransactions(walletAddress);

  if (transactions.length === 0) return;

  logger.debug(`[polymarket] Setting ${transactions.length} approval(s)`);
  await executeRelayTransaction(transactions, 'trading approvals');
  logger.debug('[polymarket] Approvals set successfully');

  await syncClobCollateralBalance();
}
