import { getProvider } from '@/handlers/web3';
import { RainbowError } from '@/logger';
import { ChainId } from '@/state/backendNetworks/types';
import { time } from '@/utils';

const CONFIRMATION_TIMEOUT = time.minutes(1);

export async function awaitPolygonConfirmation(hash: string, confirmations = 1): Promise<void> {
  const provider = getProvider({ chainId: ChainId.polygon });
  const receipt = await provider.waitForTransaction(hash, confirmations, CONFIRMATION_TIMEOUT);

  if (receipt.status === 0) {
    throw new RainbowError('[polymarket]: Transaction reverted', { hash });
  }
}
