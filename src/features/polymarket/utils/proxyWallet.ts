import { Signer } from '@ethersproject/abstract-signer';
import { OperationType, RelayClient, RelayerTransactionState, SafeTransaction } from '@polymarket/builder-relayer-client';
import { ChainId } from '@rainbow-me/swaps';
import { ethers, Wallet } from 'ethers';
import {
  BUILDER_CONFIG,
  POLYGON_USDC_ADDRESS,
  POLYMARKET_CTF_ADDRESS,
  POLYMARKET_EXCHANGE_ADDRESS,
  POLYMARKET_NEG_RISK_ADAPTER_ADDRESS,
  POLYMARKET_NEG_RISK_EXCHANGE_ADDRESS,
  POLYMARKET_RELAYER_PROXY_URL,
} from '@/features/polymarket/constants';
import { getPolymarketRelayClient, usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { erc1155Interface, erc20Interface } from '@/features/polymarket/utils/erc20Interface';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { erc20ABI } from '@/references';
import { awaitPolygonConfirmation } from './confirmation';

// ============================================================================
// Contracts
// ============================================================================

const polygonProvider = getProvider({ chainId: ChainId.polygon });

const usdcContract = new ethers.Contract(POLYGON_USDC_ADDRESS, erc20ABI, polygonProvider);

const ctfContract = new ethers.Contract(
  POLYMARKET_CTF_ADDRESS,
  ['function isApprovedForAll(address account, address operator) view returns (bool)'],
  polygonProvider
);

/**
 * Polymarket contracts that require token approvals for trading.
 *
 * Binary markets use Exchange.
 * Multi-outcome (neg-risk) markets use NegRiskExchange + NegRiskAdapter.
 */
const APPROVAL_TARGETS = {
  Exchange: POLYMARKET_EXCHANGE_ADDRESS,
  NegRiskExchange: POLYMARKET_NEG_RISK_EXCHANGE_ADDRESS,
  NegRiskAdapter: POLYMARKET_NEG_RISK_ADAPTER_ADDRESS,
} as const;

type ApprovalTarget = keyof typeof APPROVAL_TARGETS;

// ============================================================================
// Approval Checks
// ============================================================================

const USDC_APPROVAL_THRESHOLD = ethers.utils.parseUnits('1000000000', 6); // 1B USDC

async function hasUsdcApproval(owner: string, spender: string): Promise<boolean> {
  const allowance = await usdcContract.allowance(owner, spender);
  return allowance.gte(USDC_APPROVAL_THRESHOLD);
}

async function hasCtfApproval(owner: string, operator: string): Promise<boolean> {
  return ctfContract.isApprovedForAll(owner, operator);
}

// ============================================================================
// Transaction Builders
// ============================================================================

function buildUsdcApproval(spender: string): SafeTransaction {
  return {
    to: POLYGON_USDC_ADDRESS,
    data: erc20Interface.encodeFunctionData('approve', [spender, ethers.constants.MaxUint256]),
    value: '0',
    operation: OperationType.Call,
  };
}

function buildCtfApproval(operator: string): SafeTransaction {
  return {
    to: POLYMARKET_CTF_ADDRESS,
    data: erc1155Interface.encodeFunctionData('setApprovalForAll', [operator, true]),
    value: '0',
    operation: OperationType.Call,
  };
}

// ============================================================================
// Relay Execution
// ============================================================================

async function executeRelayTransaction(client: RelayClient, transactions: SafeTransaction[], description: string): Promise<void> {
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

  const checks = await Promise.all(
    targets.flatMap(([name, address]) => [
      hasUsdcApproval(proxyAddress, address).then(approved => ({ type: 'usdc' as const, name, address, approved })),
      hasCtfApproval(proxyAddress, address).then(approved => ({ type: 'ctf' as const, name, address, approved })),
    ])
  );

  const transactions: SafeTransaction[] = [];

  for (const { type, name, address, approved } of checks) {
    if (!approved) {
      logger.debug(`[polymarket] Adding ${type.toUpperCase()} approval for ${name}`);
      transactions.push(type === 'usdc' ? buildUsdcApproval(address) : buildCtfApproval(address));
    }
  }

  return transactions;
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

async function deployProxyIfNeeded(client: RelayClient, proxyAddress: string): Promise<void> {
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

/**
 * Ensures the proxy wallet is deployed and all trading approvals are set.
 * Called after a deposit transaction is submitted.
 *
 * Accepts the signer from the deposit flow to avoid redundant authentication.
 */
export async function ensureProxyWalletDeployedAndUsdcApproved(signer: Signer): Promise<void> {
  if (!(signer instanceof Wallet)) {
    throw new RainbowError('[polymarket] Hardware wallets are not supported');
  }

  const proxyAddress = usePolymarketClients.getState().proxyAddress;
  if (!proxyAddress) {
    throw new RainbowError('[polymarket] No proxy address available');
  }

  const client = new RelayClient(POLYMARKET_RELAYER_PROXY_URL, ChainId.polygon, signer, BUILDER_CONFIG);
  await deployProxyIfNeeded(client, proxyAddress);
  await ensureAllTradingApprovals(client, proxyAddress);
}

/**
 * Ensures the proxy wallet is deployed.
 */
export async function ensureProxyWalletIsDeployed(proxyAddress: string): Promise<void> {
  const client = await getPolymarketRelayClient();
  await deployProxyIfNeeded(client, proxyAddress);
}

/**
 * Ensures all trading approvals are set for the proxy wallet.
 */
export async function ensureTradingApprovals(proxyAddress: string): Promise<void> {
  const client = await getPolymarketRelayClient();
  await ensureAllTradingApprovals(client, proxyAddress);
}
