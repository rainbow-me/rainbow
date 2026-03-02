import { Interface } from '@ethersproject/abi';
import { type SafeTransaction, OperationType, type RelayerTransaction, RelayerTransactionState } from '@polymarket/builder-relayer-client';
import { POLYGON_USDC_ADDRESS, POLYMARKET_CTF_ADDRESS, POLYMARKET_NEG_RISK_ADAPTER_ADDRESS } from '../constants';
import { getPolymarketRelayClient } from '../stores/derived/usePolymarketClients';
import { type PolymarketPosition } from '../types';
import { zeroHash } from 'viem';
import { ensureError, RainbowError } from '@/logger';
import { analytics } from '@/analytics';

const ctfInterface = new Interface([
  'function redeemPositions(address collateralToken, bytes32 parentCollectionId, bytes32 conditionId, uint256[] indexSets)',
]);

const negRiskAdapterInterface = new Interface(['function redeemPositions(bytes32 conditionId, uint256[] amounts)']);

function buildCtfRedeemTransaction(conditionId: string): SafeTransaction {
  return {
    to: POLYMARKET_CTF_ADDRESS,
    operation: OperationType.Call,
    data: ctfInterface.encodeFunctionData('redeemPositions', [POLYGON_USDC_ADDRESS, zeroHash, conditionId, [1, 2]]),
    value: '0',
  };
}

function buildNegRiskRedeemTransaction(conditionId: string, amounts: [bigint, bigint]): SafeTransaction {
  return {
    to: POLYMARKET_NEG_RISK_ADAPTER_ADDRESS,
    operation: OperationType.Call,
    data: negRiskAdapterInterface.encodeFunctionData('redeemPositions', [conditionId, amounts]),
    value: '0',
  };
}

export async function redeemPosition(position: PolymarketPosition): Promise<RelayerTransaction | undefined> {
  let tx: RelayerTransaction | undefined;
  try {
    const client = await getPolymarketRelayClient();

    let redeemTx: SafeTransaction;

    if (position.negativeRisk) {
      const rawAmount = BigInt(Math.round(position.size * 1e6));
      const amounts: [bigint, bigint] = position.outcomeIndex === 0 ? [rawAmount, BigInt(0)] : [BigInt(0), rawAmount];
      redeemTx = buildNegRiskRedeemTransaction(position.conditionId, amounts);
    } else {
      redeemTx = buildCtfRedeemTransaction(position.conditionId);
    }

    const response = await client.execute([redeemTx], 'Redeem position');
    /**
     * TODO: Patch the client to differentiate between failure and timeout
     */
    tx = await client.pollUntilState(
      response.transactionID,
      [RelayerTransactionState.STATE_CONFIRMED],
      RelayerTransactionState.STATE_FAILED,
      100
    );

    if (!tx) {
      throw new RainbowError('[redeemPosition] Failed to redeem position');
    }

    trackRedeemPosition({ position, tx });

    return tx;
  } catch (e) {
    const error = ensureError(e);
    trackRedeemPositionFailed({ position, tx, error });
    throw error;
  }
}

function trackRedeemPosition({ position, tx }: { position: PolymarketPosition; tx: RelayerTransaction }) {
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

function trackRedeemPositionFailed({
  position,
  tx,
  error,
}: {
  position: PolymarketPosition;
  tx: RelayerTransaction | undefined;
  error: Error;
}) {
  const isWin = position.size === position.currentValue;

  analytics.track(analytics.event.predictionsRedeemPositionFailed, {
    eventSlug: position.eventSlug,
    marketSlug: position.slug,
    outcome: position.outcome,
    tokenId: position.asset,
    valueUsd: position.currentValue,
    type: isWin ? 'claim' : 'burn',
    transactionHash: tx?.transactionHash,
    transactionId: tx?.transactionID,
    transactionState: tx?.state,
    errorMessage: error.message,
  });
}
