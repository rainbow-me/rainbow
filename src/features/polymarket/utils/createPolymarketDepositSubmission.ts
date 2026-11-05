import type { BigNumber } from 'ethers';
import { type Address } from 'viem';

import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { getPolygonUsdcBalance, wrapUsdcToPusd } from '@/features/polymarket/utils/collateral';
import { refetchPolymarketBalance } from '@/features/polymarket/utils/refetchPolymarketStores';
import { syncClobCollateralBalance } from '@/features/polymarket/utils/syncClobCollateralBalance';
import { time } from '@/framework/core/utils/time';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { type DepositSubmission, type DepositSubmitContext } from '@/systems/funding/types';
import { delay } from '@/utils/delay';

async function waitForSubmittedDeposit({ confirmationChainId, hash, isConfirmed }: DepositSubmitContext): Promise<void> {
  if (!hash || isConfirmed) {
    return;
  }

  try {
    await getProvider({ chainId: confirmationChainId }).waitForTransaction(hash, 1, time.minutes(1));
  } catch (error) {
    logger.warn('[polymarket] Deposit confirmation wait timed out before wrapping', { error, hash });
  }
}

async function waitForUsdcBalanceIncrease(address: Address, baselineBalance: BigNumber): Promise<BigNumber> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < time.minutes(1)) {
    const usdcBalance = await getPolygonUsdcBalance(address);

    if (usdcBalance.gt(baselineBalance)) {
      return usdcBalance;
    }

    await delay(time.seconds(3));
  }

  throw new RainbowError('[polymarket] Timed out waiting for USDC.e deposit to arrive');
}

type PolymarketClients = ReturnType<typeof usePolymarketClients.getState>;

/** Captures the active Polymarket client generation for one deposit command. */
export function createPolymarketDepositSubmission(): DepositSubmission {
  const clients = usePolymarketClients.getState();

  return {
    prepare: async signer => {
      if (!clients.getWallet) throw new RainbowError('[polymarket] Wallet is unavailable');
      await clients.getWallet(signer);
    },
    onSubmitted: context => handlePolymarketDepositSubmitted(clients, context),
  };
}

async function handlePolymarketDepositSubmitted(clients: PolymarketClients, context: DepositSubmitContext): Promise<void> {
  if (context.expectedRawTargetAmount === '0') {
    logger.error(new RainbowError('[polymarket] Expected target amount is 0'));
    return;
  }

  const { getClobClient, getWallet, proxyAddress } = clients;
  if (!getClobClient || !getWallet || !proxyAddress) throw new RainbowError('[polymarket] Wallet is unavailable');

  const baselineBalance = await getPolygonUsdcBalance(proxyAddress);

  const [, wallet] = await Promise.all([waitForSubmittedDeposit(context), getWallet()]);

  const usdcBalance = await waitForUsdcBalanceIncrease(proxyAddress, baselineBalance);

  await wrapUsdcToPusd({ amount: usdcBalance, wallet });

  await Promise.all([getClobClient().then(syncClobCollateralBalance), refetchPolymarketBalance(proxyAddress)]);
}
