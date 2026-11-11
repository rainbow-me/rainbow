import { Interface } from '@ethersproject/abi';
import { OperationType, type RelayerTransactionResponse, type SafeTransaction } from '@polymarket/builder-relayer-client';
import { decodeFunctionResult, encodeFunctionData, erc1155Abi, isHex, parseAbi, toHex, zeroHash, type Address } from 'viem';

import { analytics } from '@/analytics';
import { getPolymarketWallet } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { polymarketBalanceActions, type PolymarketBalanceUpdate } from '@/features/polymarket/stores/polymarketBalanceStore';
import { polymarketPositionsActions, type PolymarketPositionUpdate } from '@/features/polymarket/stores/polymarketPositionsStore';
import { getPositionAction, PositionAction } from '@/features/polymarket/utils/getPositionAction';
import { refetchPolymarketStores } from '@/features/polymarket/utils/refetchPolymarketStores';
import { getProvider } from '@/handlers/web3';
import { ensureError, logger, RainbowError } from '@/logger';
import { ChainId } from '@rainbow-me/swaps';

import {
  POLYMARKET_CTF_ADDRESS,
  POLYMARKET_CTF_COLLATERAL_ADAPTER_ADDRESS,
  POLYMARKET_NEG_RISK_CTF_COLLATERAL_ADAPTER_ADDRESS,
  POLYMARKET_POSITION_MANAGER,
  POLYMARKET_PUSD_ADDRESS,
  POLYMARKET_ROUTER,
} from '../constants';
import { type PolymarketPosition } from '../types';
import { getHeldTokenVersion, type HeldPolymarketToken } from './marketProtocol';
import { waitForRelayerTransaction } from './relayExecution';
import { getMissingOperatorApproval } from './tradingApprovals';

type RedemptionPosition = HeldPolymarketToken &
  Pick<PolymarketPosition, 'conditionId' | 'currentValue' | 'eventSlug' | 'negativeRisk' | 'outcome' | 'proxyWallet' | 'size' | 'slug'>;

type SubmittedPolymarketRedemption = {
  followUp: Promise<void>;
};

const REDEMPTION_DESCRIPTION = 'Redeem position';

const ctfInterface = new Interface([
  'function redeemPositions(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] indexSets)',
]);

function buildCtfRedeemTransaction(conditionId: string, adapterAddress: Address): SafeTransaction {
  return {
    to: adapterAddress,
    operation: OperationType.Call,
    data: ctfInterface.encodeFunctionData('redeemPositions', [POLYMARKET_PUSD_ADDRESS, zeroHash, conditionId, [1, 2]]),
    value: '0',
  };
}

export async function redeemPosition(position: PolymarketPosition): Promise<SubmittedPolymarketRedemption> {
  let balanceUpdate: PolymarketBalanceUpdate | undefined;
  let response: RelayerTransactionResponse;

  try {
    const wallet = await getPolymarketWallet(position.proxyWallet);
    const transactions = await buildRedeemTransactions(position);

    if (getPositionAction(position) === PositionAction.CLAIM) {
      balanceUpdate = polymarketBalanceActions.beginUpdate(position.proxyWallet);
    }

    response = await wallet.execute(transactions, REDEMPTION_DESCRIPTION);
  } catch (e) {
    balanceUpdate?.discard();
    const error = ensureError(e);
    trackRedeemPositionFailed({ position, error });
    throw error;
  }

  let positionUpdate: PolymarketPositionUpdate | undefined;
  try {
    positionUpdate = polymarketPositionsActions.remove(position);
    balanceUpdate?.apply(String(position.currentValue));
  } catch (error) {
    logger.error(new RainbowError('[redeemPosition] Error publishing redeemed position', ensureError(error)));
  }

  return {
    followUp: reconcileRedemption(position, response, positionUpdate, balanceUpdate),
  };
}

async function reconcileRedemption(
  position: PolymarketPosition,
  response: RelayerTransactionResponse,
  positionUpdate: PolymarketPositionUpdate | undefined,
  balanceUpdate: PolymarketBalanceUpdate | undefined
): Promise<void> {
  try {
    const outcome = await settleRedemption(position, response);

    if (outcome === 'failed') {
      positionUpdate?.discard();
      balanceUpdate?.discard();
    } else {
      balanceUpdate?.finalize();
    }

    await refetchPolymarketStores(position.proxyWallet);
  } catch (error) {
    logger.error(new RainbowError('[redeemPosition] Error reconciling redemption', ensureError(error)));
  }
}

async function buildRedeemTransactions(position: RedemptionPosition): Promise<SafeTransaction[]> {
  if ((await getHeldTokenVersion(position)) === 'v1') {
    const adapter = position.negativeRisk ? POLYMARKET_NEG_RISK_CTF_COLLATERAL_ADAPTER_ADDRESS : POLYMARKET_CTF_COLLATERAL_ADAPTER_ADDRESS;
    const approvals = await getMissingOperatorApproval(position.proxyWallet, POLYMARKET_CTF_ADDRESS, adapter);

    return [...approvals, buildCtfRedeemTransaction(position.conditionId, adapter)];
  }

  const positionId = BigInt(position.asset);
  const conditionId = toHex(positionId >> 8n, { size: 31 });
  const outcomeIndex = positionId & 0xffn;

  if (outcomeIndex > 1n) throw new Error('Unsupported redemption outcome');

  const [amount, approvals] = await Promise.all([
    getPositionBalance(position.proxyWallet, positionId),
    getMissingOperatorApproval(position.proxyWallet, POLYMARKET_POSITION_MANAGER, POLYMARKET_ROUTER),
  ]);

  if (amount === 0n) throw new Error('No position to redeem');

  return [
    ...approvals,
    {
      to: POLYMARKET_ROUTER,
      operation: OperationType.Call,
      data: encodeFunctionData({
        abi: parseAbi(['function redeem(bytes31 conditionId, uint256 outcomeIndex, uint256 amount)']),
        functionName: 'redeem',
        args: [conditionId, outcomeIndex, amount],
      }),
      value: '0',
    },
  ];
}

async function getPositionBalance(owner: Address, positionId: bigint): Promise<bigint> {
  const balance = await getProvider({ chainId: ChainId.polygon }).call({
    to: POLYMARKET_POSITION_MANAGER,
    data: encodeFunctionData({ abi: erc1155Abi, functionName: 'balanceOf', args: [owner, positionId] }),
  });

  if (!isHex(balance)) throw new Error('Invalid PositionManager balance');
  return decodeFunctionResult({ abi: erc1155Abi, functionName: 'balanceOf', data: balance });
}

async function settleRedemption(position: RedemptionPosition, response: RelayerTransactionResponse): Promise<'confirmed' | 'failed'> {
  let tx: Awaited<ReturnType<typeof waitForRelayerTransaction>>;
  try {
    tx = await waitForRelayerTransaction(response, REDEMPTION_DESCRIPTION);
  } catch (e) {
    trackRedeemPositionFailed({ position, error: ensureError(e) });
    return 'failed';
  }

  trackRedeemPosition({ position, tx });
  return 'confirmed';
}

function trackRedeemPosition({
  position,
  tx,
}: {
  position: RedemptionPosition;
  tx: Awaited<ReturnType<typeof waitForRelayerTransaction>>;
}): void {
  const isWin = position.size === position.currentValue;

  analytics.track(analytics.event.predictionsRedeemPosition, {
    eventSlug: position.eventSlug,
    marketSlug: position.slug,
    outcome: position.outcome,
    tokenId: position.asset,
    transactionHash: tx.transactionHash,
    transactionId: tx.transactionID,
    valueUsd: position.currentValue,
    type: isWin ? 'claim' : 'burn',
  });
}

function trackRedeemPositionFailed({ position, error }: { position: RedemptionPosition; error: Error }): void {
  const isWin = position.size === position.currentValue;

  analytics.track(analytics.event.predictionsRedeemPositionFailed, {
    eventSlug: position.eventSlug,
    marketSlug: position.slug,
    outcome: position.outcome,
    tokenId: position.asset,
    valueUsd: position.currentValue,
    type: isWin ? 'claim' : 'burn',
    transactionHash: undefined,
    transactionId: undefined,
    transactionState: undefined,
    errorMessage: error.message,
  });
}
