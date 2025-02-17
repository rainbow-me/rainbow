import { AIRDROP_BPS, CREATOR_BPS, CREATOR_BPS_WITH_AIRDROP } from '../constants';

const TICK_SPACING = 200;
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

  // Calculate tick
  const exactTick = Math.log(targetPriceEth) / Math.log(1.0001);
  const roundedTick = Math.floor(exactTick / TICK_SPACING) * TICK_SPACING;

  // Calculate actual starting values with rounded tick
  const actualPriceEth = Math.pow(1.0001, roundedTick);
  const actualPriceUsd = actualPriceEth * ethPriceUsd;
  const actualMarketCap = actualPriceUsd * totalSupply;

  // Calculate swap outcome if amountInEth is provided
  let swap = undefined;
  if (amountInEth > 0) {
    const feeAmount = (amountInEth * POOL_FEE) / FEE_DENOMINATOR;
    const amountInAfterFee = amountInEth - feeAmount;
    const tokensOut = amountInAfterFee / actualPriceEth;

    // Calculate price impact
    const initialLiquidityValue = lpSupply * actualPriceEth;
    const priceImpact = (amountInEth / initialLiquidityValue) * 100;

    // Post-swap market cap
    const remainingLpTokens = lpSupply - tokensOut;
    const postSwapMarketCapUsd = remainingLpTokens * actualPriceEth * ethPriceUsd;

    creatorAmount += tokensOut;
    creatorAllocationBips = (creatorAmount / totalSupply) * 10000;
    lpAllocationBips = 10000 - creatorAllocationBips - airdropAllocationBips;
    lpSupply = totalSupply - creatorAmount - airdropAmount;

    swap = {
      input: {
        amountInEth,
        feeAmount,
        amountInAfterFee,
      },
      output: {
        tokensOut,
        priceImpact,
      },
      marketCapAfterUsd: postSwapMarketCapUsd,
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
    tick: roundedTick,
    marketCap: {
      targetUsd: targetMarketCapUsd,
      actualUsd: actualMarketCap,
      targetEth: targetMarketCapEth,
    },
    swap,
  };
}
