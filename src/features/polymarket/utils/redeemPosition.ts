import { Interface } from '@ethersproject/abi';
import { OperationType, type RelayerTransaction, type SafeTransaction } from '@polymarket/builder-relayer-client';
import { zeroHash, type Address } from 'viem';

import { analytics } from '@/analytics';
import { ensureError } from '@/logger';

import {
  POLYMARKET_CTF_COLLATERAL_ADAPTER_ADDRESS,
  POLYMARKET_NEG_RISK_CTF_COLLATERAL_ADAPTER_ADDRESS,
  POLYMARKET_PUSD_ADDRESS,
} from '../constants';
import { type PolymarketPosition } from '../types';
import { submitTradingWalletTransaction, waitForRelayerTransaction } from './relayExecution';
import { getMissingCtfOperatorApprovalTransactions } from './tradingApprovals';

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

export async function redeemPosition(position: PolymarketPosition): Promise<RelayerTransaction | undefined> {
  let tx: RelayerTransaction | undefined;
  try {
    const adapterAddress = position.negativeRisk
      ? POLYMARKET_NEG_RISK_CTF_COLLATERAL_ADAPTER_ADDRESS
      : POLYMARKET_CTF_COLLATERAL_ADAPTER_ADDRESS;
    const redeemTx = buildCtfRedeemTransaction(position.conditionId, adapterAddress);

    const approvalTransactions = await getMissingCtfOperatorApprovalTransactions(adapterAddress);
    const description = 'Redeem position';
    const response = await submitTradingWalletTransaction({
      transactions: [...approvalTransactions, redeemTx],
      description,
    });
    tx = await waitForRelayerTransaction(response, description);

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
