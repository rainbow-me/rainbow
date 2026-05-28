import { type Signer } from '@ethersproject/abstract-signer';
import type { BigNumber } from 'ethers';
import { type Address } from 'viem';

import { getPolygonUsdcBalance, wrapUsdcToPusd } from '@/features/polymarket/utils/collateral';
import { refetchPolymarketBalance } from '@/features/polymarket/utils/refetchPolymarketStores';
import { ensureTradingWalletDeployed } from '@/features/polymarket/utils/relayExecution';
import { syncClobCollateralBalance } from '@/features/polymarket/utils/syncClobCollateralBalance';
import { time } from '@/framework/core/utils/time';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { type DepositSubmitContext } from '@/systems/funding/types';
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

export async function handlePolymarketDepositSubmitted(_: Signer, context: DepositSubmitContext): Promise<void> {
  const proxyAddress = await ensureTradingWalletDeployed();
  const baselineBalance = await getPolygonUsdcBalance(proxyAddress);

  await waitForSubmittedDeposit(context);

  if (context.expectedRawTargetAmount === '0') {
    logger.error(new RainbowError('[polymarket] Expected target amount is 0'));
    return;
  }

  const usdcBalance = await waitForUsdcBalanceIncrease(proxyAddress, baselineBalance);

  await wrapUsdcToPusd({ proxyAddress, amount: usdcBalance });

  await Promise.all([syncClobCollateralBalance(), refetchPolymarketBalance()]);
}
