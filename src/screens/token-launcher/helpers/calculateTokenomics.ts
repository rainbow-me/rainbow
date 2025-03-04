import { AIRDROP_BPS, CREATOR_BPS, CREATOR_BPS_WITH_AIRDROP } from '../constants';
import { parseUnits } from 'viem';
import { TokenLauncher } from '@/hooks/useTokenLauncher';

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
    const feeAmount = (amountInEth * POOL_FEE) / FEE_DENOMINATOR;
    const amountInAfterFee = amountInEth - feeAmount;
    const tokensOut = amountInAfterFee / actualPriceEth;

    // Calculate price impact
    const initialLiquidityValue = lpSupply * actualPriceEth;
    const priceImpact = (amountInEth / initialLiquidityValue) * 100;

    // Post-swap market cap
    const remainingLpTokens = lpSupply - tokensOut;
    const postSwapMarketCapUsd = remainingLpTokens * actualPriceEth * ethPriceUsd;
    const postSwapMarketCapEth = postSwapMarketCapUsd / ethPriceUsd;
    const postSwapPriceUsd = postSwapMarketCapUsd / totalSupply;
    const postSwapPriceEth = postSwapPriceUsd / ethPriceUsd;

    actualMarketCapUsd = postSwapMarketCapUsd;
    actualMarketCapEth = postSwapMarketCapEth;
    actualPriceUsd = postSwapPriceUsd;
    actualPriceEth = postSwapPriceEth;

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
      marketCapAfterEth: postSwapMarketCapEth,
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
