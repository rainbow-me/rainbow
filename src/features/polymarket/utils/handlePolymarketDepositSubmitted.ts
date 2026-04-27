import { type Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from 'ethers';

import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { getPolymarketUsdcBalance, wrapUsdcToPusd } from '@/features/polymarket/utils/collateral';
import { createPolymarketRelayClient, deployProxyIfNeeded } from '@/features/polymarket/utils/proxyWallet';
import { refetchPolymarketBalance } from '@/features/polymarket/utils/refetchPolymarketStores';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { type DepositSubmitContext } from '@/systems/funding/types';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';

async function waitForSubmittedDeposit({ confirmationChainId, hash, isConfirmed }: DepositSubmitContext): Promise<void> {
  if (!hash || isConfirmed) return;

  try {
    await getProvider({ chainId: confirmationChainId }).waitForTransaction(hash, 1, time.minutes(1));
  } catch (error) {
    logger.warn('[polymarket] Deposit confirmation wait timed out before wrapping', { error, hash });
  }
}

async function waitForWrappableUsdcBalance(proxyAddress: string, expectedRawTargetAmount: string): Promise<BigNumber> {
  const expectedBalance = BigNumber.from(expectedRawTargetAmount);
  const startedAt = Date.now();

  while (Date.now() - startedAt < time.minutes(1)) {
    const usdcBalance = await getPolymarketUsdcBalance(proxyAddress);
    const hasExpectedBalance = expectedBalance ? usdcBalance.gte(expectedBalance) : !usdcBalance.isZero();

    if (hasExpectedBalance) {
      return usdcBalance;
    }

    await delay(time.seconds(3));
  }

  throw new RainbowError('[polymarket] Timed out waiting for USDC.e deposit to arrive');
}

export async function handlePolymarketDepositSubmitted(signer: Signer, context: DepositSubmitContext): Promise<void> {
  const proxyAddress = usePolymarketClients.getState().proxyAddress;
  if (!proxyAddress) {
    throw new RainbowError('[polymarket] No proxy address available');
  }

  const client = createPolymarketRelayClient(signer);
  await deployProxyIfNeeded(client, proxyAddress);
  await waitForSubmittedDeposit(context);

  if (context.expectedRawTargetAmount === '0') {
    logger.error(new RainbowError('[polymarket] Expected target amount is 0'));
    return;
  }

  const usdcBalance = await waitForWrappableUsdcBalance(proxyAddress, context.expectedRawTargetAmount);
  await wrapUsdcToPusd({ client, proxyAddress, amount: usdcBalance });
  await refetchPolymarketBalance();
}
