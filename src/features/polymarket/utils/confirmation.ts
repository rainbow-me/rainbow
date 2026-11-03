import { ChainId } from '@/features/network/types/backendNetworks';
import { PolymarketTransactionFailedError } from '@/features/polymarket/errors';
import { time } from '@/framework/core/utils/time';
import { getProvider } from '@/handlers/web3';

const CONFIRMATION_TIMEOUT = time.minutes(1);

let latestConfirmedPolygonBlockNumber = 0;

export function getLatestConfirmedPolygonBlockNumber(): number {
  return latestConfirmedPolygonBlockNumber;
}

export async function awaitPolygonConfirmation(hash: string, confirmations = 1): Promise<void> {
  const provider = getProvider({ chainId: ChainId.polygon });
  const receipt = await provider.waitForTransaction(hash, confirmations, CONFIRMATION_TIMEOUT);

  if (receipt.status === 0) {
    throw new PolymarketTransactionFailedError('[polymarket]: Transaction reverted', { hash });
  }

  latestConfirmedPolygonBlockNumber = Math.max(latestConfirmedPolygonBlockNumber, receipt.blockNumber);
}
