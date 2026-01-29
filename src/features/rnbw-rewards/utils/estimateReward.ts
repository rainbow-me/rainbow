import { CrosschainQuote, getTargetAddress, Quote } from '@rainbow-me/swaps';
import { getPlatformClient } from '@/resources/platform/client';

type EstimateRewardToken = {
  address: string;
  chainId: string;
};

type EstimateRewardPayload = {
  currency: string;
  swap: {
    feeRaw: string;
    feeToken: EstimateRewardToken;
    feeTokenDecimals: number;
    inputToken: EstimateRewardToken;
    outputToken: EstimateRewardToken;
    targetRouter: string;
  };
};

export type EstimateRewardResult = {
  decimals: number;
  eligible: boolean;
  rejectionDetails: string;
  rejectionReason: string;
  rewardRnbw: string;
  rewardsValueInCurrency: string;
  rnbwTokenPriceInCurrency: string;
};

type EstimateRewardResponse = {
  result: EstimateRewardResult;
};

export function buildEstimateRewardPayload({
  quote,
  currency,
}: {
  quote: Quote | CrosschainQuote;
  currency: string;
}): EstimateRewardPayload | null {
  const targetRouter = getTargetAddress(quote);

  // TODO: what is the fee token asset and in what cases can it be undefined? Is this a scenario backend is aware of?
  const feeTokenAsset = quote.feeTokenAsset;
  const feeTokenChainId = feeTokenAsset?.chainId;
  const feeTokenAddress = feeTokenChainId && feeTokenAsset?.networks[feeTokenChainId]?.address;

  if (!feeTokenAddress || !feeTokenChainId || !targetRouter) return null;

  const inputToken = {
    address: quote.sellTokenAddress,
    chainId: String(quote.chainId),
  };
  const outputToken = {
    address: quote.buyTokenAddress,
    chainId: String(quote.chainId),
  };
  const feeToken = {
    address: feeTokenAddress,
    chainId: String(feeTokenChainId),
  };
  return {
    currency,
    swap: {
      feeRaw: String(quote.fee),
      feeToken,
      feeTokenDecimals: feeTokenAsset.decimals,
      inputToken,
      outputToken,
      targetRouter,
    },
  };
}

export async function fetchEstimateReward({
  payload,
  abortController,
}: {
  payload: EstimateRewardPayload;
  abortController?: AbortController | null;
}): Promise<EstimateRewardResult | null> {
  const { data } = await getPlatformClient().post<EstimateRewardResponse>('/rewards/EstimateReward', payload, {
    abortController,
  });

  return data?.result ?? null;
}
