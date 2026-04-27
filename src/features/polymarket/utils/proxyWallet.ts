import { type Signer } from '@ethersproject/abstract-signer';
import { OperationType, RelayClient, RelayerTransactionState, type SafeTransaction } from '@polymarket/builder-relayer-client';
import { Wallet } from 'ethers';
import { decodeFunctionResult, encodeFunctionData, erc1155Abi, maxUint256, parseUnits, type Address, type Hex } from 'viem';

import {
  BUILDER_CONFIG,
  POLYMARKET_CTF_ADDRESS,
  POLYMARKET_CTF_EXCHANGE_ADDRESS,
  POLYMARKET_NEG_RISK_ADAPTER_ADDRESS,
  POLYMARKET_NEG_RISK_CTF_EXCHANGE_ADDRESS,
  POLYMARKET_PUSD_ADDRESS,
  POLYMARKET_RELAYER_PROXY_URL,
} from '@/features/polymarket/constants';
import { getPolymarketRelayClient } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { getMissingErc20ApprovalTransaction } from '@/features/polymarket/utils/erc20Approval';
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
  Exchange: POLYMARKET_CTF_EXCHANGE_ADDRESS,
  NegRiskExchange: POLYMARKET_NEG_RISK_CTF_EXCHANGE_ADDRESS,
  NegRiskAdapter: POLYMARKET_NEG_RISK_ADAPTER_ADDRESS,
} as const;

type ApprovalTarget = keyof typeof APPROVAL_TARGETS;

// ============================================================================
// Approval Checks
// ============================================================================

async function hasCtfApproval(owner: string, operator: string): Promise<boolean> {
  const data = encodeFunctionData({
    abi: erc1155Abi,
    functionName: 'isApprovedForAll',
    args: [owner as Address, operator as Address],
  });
  const result = await polygonProvider.call({ to: POLYMARKET_CTF_ADDRESS, data });

  return decodeFunctionResult({
    abi: erc1155Abi,
    functionName: 'isApprovedForAll',
    data: result as Hex,
  });
}

// ============================================================================
// Transaction Builders
// ============================================================================

function buildCtfApproval(operator: string): SafeTransaction {
  return {
    to: POLYMARKET_CTF_ADDRESS,
    data: encodeFunctionData({
      abi: erc1155Abi,
      functionName: 'setApprovalForAll',
      args: [operator as Address, true],
    }),
    value: '0',
    operation: OperationType.Call,
  };
}

// ============================================================================
// Relay Execution
// ============================================================================

export async function executeRelayTransaction(client: RelayClient, transactions: SafeTransaction[], description: string): Promise<void> {
  const response = await client.execute(transactions, description);

  if (response.state === RelayerTransactionState.STATE_FAILED) {
    throw new RainbowError(`[polymarket] ${description} failed`);
  }

  if (response.state === RelayerTransactionState.STATE_INVALID) {
    throw new RainbowError(`[polymarket] ${description} rejected as invalid`);
  }

  if (response.transactionHash) {
    await awaitPolygonConfirmation(response.transactionHash);
  }
}

// ============================================================================
// Core Approval Logic
// ============================================================================

/**
 * Checks all required approvals and returns transactions for any that are missing.
 */
async function getMissingApprovalTransactions(proxyAddress: string): Promise<SafeTransaction[]> {
  const targets = Object.entries(APPROVAL_TARGETS) as [ApprovalTarget, string][];

  const ctfApprovalChecks = await Promise.all(
    targets.map(([name, address]) => hasCtfApproval(proxyAddress, address).then(approved => ({ name, address, approved })))
  );

  const erc20ApprovalTransactions = await Promise.all(
    targets.map(([name, address]) =>
      getMissingErc20ApprovalTransaction({
        amount: maxUint256,
        owner: proxyAddress,
        provider: polygonProvider,
        spender: address,
        tokenAddress: POLYMARKET_PUSD_ADDRESS,
      }).then(transactions => ({ name, transactions }))
    )
  );

  const transactions: SafeTransaction[] = [];

  for (const { name, transactions: approvalTransactions } of erc20ApprovalTransactions) {
    if (approvalTransactions.length > 0) {
      logger.debug(`[polymarket] Adding PUSD approval for ${name}`);
      transactions.push(...approvalTransactions);
    }
  }

  for (const { name, address, approved } of ctfApprovalChecks) {
    if (!approved) {
      logger.debug(`[polymarket] Adding CTF approval for ${name}`);
      transactions.push(buildCtfApproval(address));
    }
  }

  return transactions;
}

export async function getMissingCtfOperatorApprovalTransactions(proxyAddress: string, operator: string): Promise<SafeTransaction[]> {
  if (await hasCtfApproval(proxyAddress, operator)) {
    return [];
  }

  logger.debug(`[polymarket] Adding CTF operator approval for ${operator}`);
  return [buildCtfApproval(operator)];
}

async function ensureAllTradingApprovals(client: RelayClient, proxyAddress: string): Promise<void> {
  const transactions = await getMissingApprovalTransactions(proxyAddress);

  if (transactions.length === 0) {
    return;
  }

  logger.debug(`[polymarket] Setting ${transactions.length} approval(s)`);
  await executeRelayTransaction(client, transactions, 'trading approvals');
  logger.debug('[polymarket] Approvals set successfully');
}

// ============================================================================
// Deployment
// ============================================================================

export async function deployProxyIfNeeded(client: RelayClient, proxyAddress: string): Promise<void> {
  const isDeployed = await client.getDeployed(proxyAddress);
  if (isDeployed) {
    return;
  }

  logger.debug('[polymarket] Deploying proxy wallet');
  const response = await client.deploy();

  if (response.state === RelayerTransactionState.STATE_FAILED) {
    throw new RainbowError('[polymarket] Proxy deployment failed');
  }

  if (response.state === RelayerTransactionState.STATE_INVALID) {
    throw new RainbowError('[polymarket] Proxy deployment rejected as invalid');
  }

  if (response.transactionHash) {
    await awaitPolygonConfirmation(response.transactionHash);
  }

  logger.debug('[polymarket] Proxy wallet deployed');
}

// ============================================================================
// Public API
// ============================================================================

export function createPolymarketRelayClient(signer: Signer): RelayClient {
  if (!(signer instanceof Wallet)) {
    throw new RainbowError('[polymarket] Hardware wallets are not supported');
  }

  return new RelayClient(POLYMARKET_RELAYER_PROXY_URL, ChainId.polygon, signer, BUILDER_CONFIG);
}

/**
 * Ensures the proxy wallet is deployed.
 */
export async function ensureProxyWalletIsDeployed(proxyAddress: string): Promise<void> {
  const client = await getPolymarketRelayClient();
  await deployProxyIfNeeded(client, proxyAddress);
}

/**
 * Ensures trading approvals are set for the proxy wallet.
 */
export async function ensureTradingApprovals(proxyAddress: string): Promise<void> {
  const client = await getPolymarketRelayClient();
  await deployProxyIfNeeded(client, proxyAddress);
  await ensureAllTradingApprovals(client, proxyAddress);
}
