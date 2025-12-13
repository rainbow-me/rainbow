import { Interface } from '@ethersproject/abi';
import { SafeTransaction, OperationType, RelayerTransaction } from '@polymarket/builder-relayer-client';
import { POLYGON_USDC_ADDRESS, POLYMARKET_CTF_ADDRESS, POLYMARKET_NEG_RISK_ADAPTER_ADDRESS } from '../constants';
import { getPolymarketRelayClient } from '../stores/derived/usePolymarketClients';
import { PolymarketPosition } from '../types';
import { zeroHash } from 'viem';

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
  return await response.wait();
}
