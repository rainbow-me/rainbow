import { OperationType, type SafeTransaction } from '@polymarket/builder-relayer-client';
import { Side, type ClobClient } from '@polymarket/clob-client-v2';
import { decodeFunctionResult, encodeFunctionData, erc1155Abi, isHex, type Address } from 'viem';

import {
  POLYMARKET_CTF_ADDRESS,
  POLYMARKET_CTF_EXCHANGE_ADDRESS,
  POLYMARKET_EXCHANGE_V3,
  POLYMARKET_NEG_RISK_ADAPTER_ADDRESS,
  POLYMARKET_NEG_RISK_CTF_EXCHANGE_ADDRESS,
  POLYMARKET_POSITION_MANAGER,
  POLYMARKET_PUSD_ADDRESS,
} from '@/features/polymarket/constants';
import { type PolymarketVersion } from '@/features/polymarket/types/polymarket-event';
import { getMissingErc20ApprovalTransaction } from '@/features/polymarket/utils/erc20Approval';
import { type PolymarketWallet } from '@/features/polymarket/utils/polymarketWallet';
import { waitForRelayerTransaction } from '@/features/polymarket/utils/relayExecution';
import { syncClobCollateralBalance } from '@/features/polymarket/utils/syncClobCollateralBalance';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { ChainId } from '@rainbow-me/swaps';

const polygonProvider = getProvider({ chainId: ChainId.polygon });

/**
 * Polymarket contracts that require broad trading approvals.
 */
const CTF_OPERATORS = [
  POLYMARKET_CTF_EXCHANGE_ADDRESS,
  POLYMARKET_NEG_RISK_CTF_EXCHANGE_ADDRESS,
  POLYMARKET_NEG_RISK_ADAPTER_ADDRESS,
] as const;

export async function getMissingOperatorApproval(owner: Address, token: Address, operator: Address): Promise<SafeTransaction[]> {
  const data = encodeFunctionData({
    abi: erc1155Abi,
    functionName: 'isApprovedForAll',
    args: [owner, operator],
  });
  const result = await polygonProvider.call({ to: token, data });
  if (!isHex(result)) throw new RainbowError('[polymarket] Provider returned non-hex call data');

  const approved = decodeFunctionResult({
    abi: erc1155Abi,
    functionName: 'isApprovedForAll',
    data: result,
  });
  if (approved) return [];
  return [
    {
      to: token,
      data: encodeFunctionData({ abi: erc1155Abi, functionName: 'setApprovalForAll', args: [operator, true] }),
      value: '0',
      operation: OperationType.Call,
    },
  ];
}

async function getTradingApprovals(owner: Address, version: PolymarketVersion, side: Side): Promise<SafeTransaction[]> {
  const approvePusd = (spender: Address) =>
    getMissingErc20ApprovalTransaction({
      owner,
      provider: polygonProvider,
      spender,
      tokenAddress: POLYMARKET_PUSD_ADDRESS,
    });
  if (version === 'v2')
    return side === Side.BUY
      ? approvePusd(POLYMARKET_EXCHANGE_V3)
      : getMissingOperatorApproval(owner, POLYMARKET_POSITION_MANAGER, POLYMARKET_EXCHANGE_V3);
  return (
    await Promise.all([
      ...CTF_OPERATORS.map(approvePusd),
      ...CTF_OPERATORS.map(operator => getMissingOperatorApproval(owner, POLYMARKET_CTF_ADDRESS, operator)),
    ])
  ).flat();
}

/**
 * Ensures the captured wallet has the approvals needed for this order.
 */
export async function ensureTradingApprovals(
  clobClient: ClobClient,
  wallet: PolymarketWallet,
  version: PolymarketVersion,
  side: Side
): Promise<void> {
  const transactions = await getTradingApprovals(wallet.address, version, side);

  if (transactions.length === 0) return;

  logger.debug(`[polymarket] Setting ${transactions.length} approval(s)`);
  const description = 'trading approvals';
  await waitForRelayerTransaction(await wallet.execute(transactions, description), description);
  logger.debug('[polymarket] Approvals set successfully');

  await syncClobCollateralBalance(clobClient);
}
