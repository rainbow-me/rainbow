import { OperationType, type SafeTransaction } from '@polymarket/builder-relayer-client';
import { decodeFunctionResult, encodeFunctionData, erc1155Abi, maxUint256, type Address } from 'viem';

import {
  POLYMARKET_CTF_ADDRESS,
  POLYMARKET_CTF_EXCHANGE_ADDRESS,
  POLYMARKET_NEG_RISK_ADAPTER_ADDRESS,
  POLYMARKET_NEG_RISK_CTF_EXCHANGE_ADDRESS,
  POLYMARKET_PUSD_ADDRESS,
} from '@/features/polymarket/constants';
import { getMissingErc20ApprovalTransaction } from '@/features/polymarket/utils/erc20Approval';
import { getPolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { ensureTradingWalletDeployed, executeRelayTransaction } from '@/features/polymarket/utils/relayExecution';
import { syncClobCollateralBalance } from '@/features/polymarket/utils/syncClobCollateralBalance';
import { requireHex } from '@/framework/core/evm/hex';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { ChainId } from '@rainbow-me/swaps';

const polygonProvider = getProvider({ chainId: ChainId.polygon });

/**
 * Polymarket contracts that require broad trading approvals.
 */
const APPROVAL_TARGETS = {
  exchange: { label: 'Exchange', address: POLYMARKET_CTF_EXCHANGE_ADDRESS },
  negRiskExchange: { label: 'NegRiskExchange', address: POLYMARKET_NEG_RISK_CTF_EXCHANGE_ADDRESS },
  negRiskAdapter: { label: 'NegRiskAdapter', address: POLYMARKET_NEG_RISK_ADAPTER_ADDRESS },
};

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

/**
 * Checks all required approvals and returns transactions for any that are missing.
 */
async function getMissingApprovalTransactions(polymarketWalletAddress: Address): Promise<SafeTransaction[]> {
  const ctfApprovalChecks = await Promise.all(
    Object.values(APPROVAL_TARGETS).map(({ address, label }) =>
      hasCtfApproval(polymarketWalletAddress, address).then(approved => ({ address, approved, label }))
    )
  );

  const erc20ApprovalTransactions = await Promise.all(
    Object.values(APPROVAL_TARGETS).map(({ address, label }) =>
      getMissingErc20ApprovalTransaction({
        amount: maxUint256,
        owner: polymarketWalletAddress,
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

/**
 * Ensures the active Polymarket trading wallet is deployed and has the
 * approvals it needs to trade.
 */
export async function ensureTradingApprovals(): Promise<void> {
  const polymarketWalletAddress = await ensureTradingWalletDeployed();
  const transactions = await getMissingApprovalTransactions(polymarketWalletAddress);

  if (transactions.length === 0) return;

  logger.debug(`[polymarket] Setting ${transactions.length} approval(s)`);
  await executeRelayTransaction(transactions, 'trading approvals');
  logger.debug('[polymarket] Approvals set successfully');

  await syncClobCollateralBalance();
}
