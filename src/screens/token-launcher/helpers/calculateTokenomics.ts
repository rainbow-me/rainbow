import { AIRDROP_BPS, CREATOR_BPS, CREATOR_BPS_WITH_AIRDROP } from '../constants';

const TICK_SPACING = 200;

export function calculateTokenomics({
  targetMarketCapUsd,
  totalSupply,
  ethPriceUsd,
  hasAirdrop = false,
}: {
  targetMarketCapUsd: number;
  totalSupply: number;
  ethPriceUsd: number;
  hasAirdrop: boolean;
}) {
  // Calculate supply allocations (same logic as in contract)
  const creatorBaseBps = hasAirdrop ? CREATOR_BPS_WITH_AIRDROP : CREATOR_BPS;
  const airdropBps = hasAirdrop ? AIRDROP_BPS : 0;
  const lpBps = 10000 - creatorBaseBps - airdropBps;

  const creatorAmount = (totalSupply * creatorBaseBps) / 10000;
  const airdropAmount = (totalSupply * airdropBps) / 10000;
  const lpSupply = totalSupply - creatorAmount - airdropAmount;

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

  return {
    supply: {
      total: totalSupply,
      lp: lpSupply,
      creator: creatorAmount,
      airdrop: airdropAmount,
    },
    allocation: {
      creator: creatorBaseBps,
      airdrop: airdropBps,
      lp: lpBps,
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
  };
}
