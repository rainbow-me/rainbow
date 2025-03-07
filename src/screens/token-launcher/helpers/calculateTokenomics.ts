import { AIRDROP_BPS, CREATOR_BPS, CREATOR_BPS_WITH_AIRDROP } from '../constants';
import { TokenLauncher } from '@/hooks/useTokenLauncher';
import { parseUnits } from '@ethersproject/units';
// 1% fee
const POOL_FEE = 10000;
// 1_000_000 for 0.01% precision
const FEE_DENOMINATOR = 1000000;

export function calculateTokenomics({
  targetMarketCapUsd,
  totalSupply,
  ethPriceUsd,
  hasAirdrop = false,
  // Creator's optional extra buy-in
  amountInEth = 0,
}: {
  targetMarketCapUsd: number;
  totalSupply: number;
  ethPriceUsd: number;
  hasAirdrop: boolean;
  amountInEth?: number;
}) {
  if (totalSupply === 0) {
    return undefined;
  }
  // Calculate supply allocations (same logic as in contract)
  const creatorBaseBips = hasAirdrop ? CREATOR_BPS_WITH_AIRDROP : CREATOR_BPS;
  const airdropAllocationBips = hasAirdrop ? AIRDROP_BPS : 0;
  let lpAllocationBips = 10000 - creatorBaseBips - airdropAllocationBips;
  let creatorAllocationBips = creatorBaseBips;

  let creatorAmount = (totalSupply * creatorBaseBips) / 10000;
  const airdropAmount = (totalSupply * airdropAllocationBips) / 10000;
  let lpSupply = totalSupply - creatorAmount - airdropAmount;

  // Calculate required price per token to achieve market cap
  const targetMarketCapEth = targetMarketCapUsd / ethPriceUsd;
  const targetPriceUsd = targetMarketCapUsd / totalSupply;
  const targetPriceEth = targetPriceUsd / ethPriceUsd;

  const tick = TokenLauncher.getInitialTick(parseUnits(targetPriceEth?.toFixed(18) ?? '0', 18));

  // Calculate actual starting values with rounded tick
  let actualPriceEth = Math.pow(1.0001, tick);
  let actualPriceUsd = actualPriceEth * ethPriceUsd;
  let actualMarketCapUsd = actualPriceUsd * totalSupply;
  let actualMarketCapEth = actualMarketCapUsd / ethPriceUsd;

  // Calculate swap outcome if amountInEth is provided
  let swap = undefined;

  // TODO: all these calculations are wrong
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
    lpAllocationBips = 10000 - creatorAllocationBips - airdropAllocationBips;
    lpSupply = totalSupply - creatorAmount - airdropAmount;

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
      airdrop: airdropAmount,
    },
    allocation: {
      creator: creatorAllocationBips,
      airdrop: airdropAllocationBips,
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
      targetEth: targetMarketCapEth,
      actualEth: actualMarketCapEth,
    },
    swap,
  };
}
