import { analytics } from '@/analytics';
import { NativeCurrencyKey } from '@/entities';
import { useRnbwRewardsStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwRewardsStore';
import { getPlatformResult } from '@/features/rnbw-rewards/utils/getPlatformResult';
import { pollClaimStatus, type PollClaimStatusResult } from '@/features/rnbw-rewards/utils/pollClaimStatus';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { loadWallet, signTypedDataMessage } from '@/model/wallet';
import { RainbowFetchResponse } from '@/rainbow-fetch';
import { getPlatformClient } from '@/resources/platform/client';
import { ChainId } from '@rainbow-me/swaps';
import { Address } from 'viem';
import {
  ClaimRewardsResult,
  ClaimRewardsResponse,
  GetClaimIntentResponse,
  GetClaimIntentResult,
} from '@/features/rnbw-rewards/types/claimRewardsTypes';

type ClaimStatusPollResult = PollClaimStatusResult<ClaimRewardsResult, ClaimRewardsResponse>;

export async function claimRewards({ address, currency }: { address: Address; currency: NativeCurrencyKey }) {
  // Only base is supported for now
  const chainId = ChainId.base;
  const startedAt = Date.now();
  const platformClient = getPlatformClient();

  let intentResponse: RainbowFetchResponse<GetClaimIntentResponse> | undefined;
  let claimResponse: RainbowFetchResponse<ClaimRewardsResponse> | undefined;
  let pollResult: ClaimStatusPollResult | undefined;

  try {
    if (!address) {
      throw new Error('Missing wallet address');
    }

    intentResponse = await platformClient.get<GetClaimIntentResponse>('/rewards/GetClaimIntent', {
      params: {
        walletAddress: address,
        chainId: String(chainId),
      },
    });

    const intentResult = getPlatformResult(intentResponse, 'GetClaimIntent');
    const intentId = intentResult.intentId;
    if (!intentResult.intent || !intentId) {
      throw new Error('GetClaimIntent response is missing intent data');
    }

    const signedIntent = await signIntent({ address, intent: intentResult.intent, chainId });

    claimResponse = await platformClient.post<ClaimRewardsResponse>('/rewards/ClaimRewards', {
      chainId: String(chainId),
      currency,
      walletAddress: address,
      intentId,
      intentSignature: signedIntent,
    });

    const claimResult = getPlatformResult(claimResponse, 'ClaimRewards');
    const claimId = claimResult.claimId;
    if (!claimId) {
      throw new Error('ClaimRewards response is missing claimId');
    }
    pollResult = await pollForClaimStatus({ claimId, address, currency, chainId });
    const finalClaimResult = pollResult.result;

    await useRnbwRewardsStore.getState().fetch(undefined, { force: true });

    analytics.track(analytics.event.rnbwRewardsClaim, {
      chainId,
      intentId,
      claimId,
      claimedRnbw: finalClaimResult.claimedRnbw,
      claimedValueInCurrency: finalClaimResult.claimedValueInCurrency,
      decimals: finalClaimResult.decimals,
      status: finalClaimResult.status,
      txHash: finalClaimResult.txHash,
      tenderlyUrl: finalClaimResult.tenderlyUrl,
      durationMs: Date.now() - startedAt,
      pollAttempts: pollResult.attempts,
      platformRequestIds: {
        intent: intentResponse?.headers?.get('x-request-id') ?? undefined,
        claim: claimResponse?.headers?.get('x-request-id') ?? undefined,
        status: pollResult?.response?.headers?.get('x-request-id') ?? undefined,
      },
    });

    return claimResult;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    const lastStatus = pollResult?.response?.data?.result?.status ?? claimResponse?.data?.result?.status;

    analytics.track(analytics.event.rnbwRewardsClaimFailed, {
      chainId,
      intentId: intentResponse?.data?.result?.intentId,
      claimId: claimResponse?.data?.result?.claimId,
      status: lastStatus,
      errorMessage,
      durationMs: Date.now() - startedAt,
      platformRequestIds: {
        intent: intentResponse?.headers?.get('x-request-id') ?? undefined,
        claim: claimResponse?.headers?.get('x-request-id') ?? undefined,
        status: pollResult?.response?.headers?.get('x-request-id') ?? undefined,
      },
    });
    logger.error(new RainbowError('[claimRewards]: Failed to claim rewards', e));
    throw e;
  }
}

async function signIntent({ address, intent, chainId }: { address: Address; intent: GetClaimIntentResult['intent']; chainId: ChainId }) {
  const provider = getProvider({ chainId });
  const signer = await loadWallet({ address, provider });
  if (!signer) {
    throw new Error('Failed to load wallet');
  }
  const messageToSign = {
    types: intent.types,
    primaryType: intent.domainPrimaryType as keyof typeof intent.types,
    domain: {
      name: intent.domain.name,
      version: intent.domain.version,
      chainId: Number(intent.domain.chainId),
      verifyingContract: intent.domain.verifyingContract,
    },
    message: intent.message,
  };
  const signedIntent = await signTypedDataMessage(messageToSign, provider, signer);
  if (!signedIntent?.result || signedIntent?.error) {
    throw new Error(`Failed to sign intent: ${signedIntent?.error?.message ?? 'Unknown error'}`);
  }
  return signedIntent.result;
}

async function pollForClaimStatus({
  claimId,
  address,
  currency,
  chainId,
}: {
  claimId: string;
  address: Address;
  currency: NativeCurrencyKey;
  chainId: ChainId;
}): Promise<ClaimStatusPollResult> {
  return pollClaimStatus({
    fetchStatus: () =>
      getPlatformClient().get<ClaimRewardsResponse>('/rewards/GetClaimStatus', {
        params: {
          claimId,
          walletAddress: address,
          chainId: String(chainId),
          currency,
        },
      }),
    getResult: response => getPlatformResult(response, 'GetClaimStatus'),
  });
}
