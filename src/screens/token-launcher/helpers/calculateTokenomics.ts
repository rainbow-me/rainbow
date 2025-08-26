import { CREATOR_BPS, TARGET_MARKET_CAP_IN_ETH } from '../constants';
import { TokenLauncherSDK } from '@/hooks/useTokenLauncher';
import { parseUnits } from '@ethersproject/units';

// 1% fee
const POOL_FEE = 10000;
// 1_000_000 for 0.01% precision
const FEE_DENOMINATOR = 1000000;

export function calculateTokenomics({
  totalSupply,
  ethPriceUsd,
  // Creator's optional extra buy-in
  amountInEth = 0,
}: {
  totalSupply: number;
  ethPriceUsd: number;
  amountInEth?: number;
}) {
  if (totalSupply === 0) {
    return undefined;
  }
  // Calculate supply allocations (same logic as in contract)
  let lpAllocationBips = 10000 - CREATOR_BPS;
  let creatorAllocationBips = CREATOR_BPS;

  let creatorAmount = (totalSupply * CREATOR_BPS) / 10000;
  let lpSupply = totalSupply - creatorAmount;

  // Calculate required price per token to achieve market cap
  const targetPriceEth = TARGET_MARKET_CAP_IN_ETH / totalSupply;
  const targetPriceUsd = targetPriceEth * ethPriceUsd;
  const targetMarketCapUsd = totalSupply * targetPriceUsd;

  const tick = TokenLauncherSDK.getInitialTick(parseUnits(targetPriceEth?.toFixed(18) ?? '0', 18));

  // Calculate actual starting values with rounded tick
  let actualPriceEth = Math.pow(1.0001, tick);
  let actualPriceUsd = actualPriceEth * ethPriceUsd;
  let actualMarketCapUsd = actualPriceUsd * totalSupply;
  let actualMarketCapEth = actualMarketCapUsd / ethPriceUsd;

  // Calculate swap outcome if amountInEth is provided
  let swap = undefined;

  // this formula uses the constant-product formula to simulate the swap and leaves room for improved accuracy
  if (amountInEth > 0) {
    // Calculate fee and amount after fee
    const feeAmount = (amountInEth * POOL_FEE) / FEE_DENOMINATOR;
    const amountInAfterFee = amountInEth - feeAmount;

    // Assume the liquidity pool (LP) has these initial reserves:
    const initialPoolEth = lpSupply * actualPriceEth;
    const initialPoolTokens = lpSupply;

    // Using the constant-product formula to simulate the swap:
    // tokensOut = initialPoolTokens - (initialPoolEth * initialPoolTokens) / (initialPoolEth + amountInAfterFee)
    const tokensOut = initialPoolTokens - (initialPoolEth * initialPoolTokens) / (initialPoolEth + amountInAfterFee);

    // Update the pool's reserves after the swap:
    const newPoolEth = initialPoolEth + amountInAfterFee;
    const newPoolTokens = initialPoolTokens - tokensOut;

    // Derive the new token price from the updated pool:
    const newPriceEth = newPoolEth / newPoolTokens;
    const newPriceUsd = newPriceEth * ethPriceUsd;

    // Calculate a new market cap using the full total supply:
    const newMarketCapUsd = totalSupply * newPriceUsd;
    const newMarketCapEth = totalSupply * newPriceEth;

    // Calculate the price impact as the percentage change in price:
    const priceImpact = ((newPriceEth - actualPriceEth) / actualPriceEth) * 100;

    // Update the creator's tokens (they receive the tokens bought from the pool)
    creatorAmount += tokensOut;

    // Recalculate allocations with updated creator tokens:
    creatorAllocationBips = (creatorAmount / totalSupply) * 10000;
    lpAllocationBips = 10000 - creatorAllocationBips;
    lpSupply = totalSupply - creatorAmount;

    // Replace our original price and market cap with the new values
    actualPriceEth = newPriceEth;
    actualPriceUsd = newPriceUsd;
    actualMarketCapUsd = newMarketCapUsd;
    actualMarketCapEth = newMarketCapEth;

    swap = {
      input: { amountInEth, feeAmount, amountInAfterFee },
      output: { tokensOut, priceImpact },
      marketCapAfterUsd: newMarketCapUsd,
      marketCapAfterEth: newMarketCapEth,
    };
  }

  return {
    supply: {
      total: totalSupply,
      lp: lpSupply,
      creator: creatorAmount,
      airdrop: 0,
    },
    allocation: {
      creator: creatorAllocationBips,
      airdrop: 0,
      lp: lpAllocationBips,
    },
    price: {
      targetUsd: targetPriceUsd,
      actualUsd: actualPriceUsd,
      actualEth: actualPriceEth,
      targetEth: targetPriceEth,
    },
    tick,
    marketCap: {
      targetUsd: targetMarketCapUsd,
      actualUsd: actualMarketCapUsd,
      targetEth: TARGET_MARKET_CAP_IN_ETH,
      actualEth: actualMarketCapEth,
    },
    swap,
  };
}
