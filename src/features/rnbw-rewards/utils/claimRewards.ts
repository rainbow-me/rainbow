import { type Signer } from '@ethersproject/abstract-signer';
import { type Address } from 'viem';

import { analytics } from '@/analytics';
import { type NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import {
  type ClaimRewardsResponse,
  type ClaimRewardsResult,
  type GetClaimIntentResponse,
  type GetClaimIntentResult,
} from '@/features/rnbw-rewards/types/claimRewardsTypes';
import { getPlatformResult } from '@/features/rnbw-rewards/utils/getPlatformResult';
import { pollClaimStatus, type PollClaimStatusResult } from '@/features/rnbw-rewards/utils/pollClaimStatus';
import { type RainbowFetchResponse } from '@/framework/data/http/rainbowFetch';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { loadWallet, signTypedDataMessage } from '@/model/wallet';
import Navigation from '@/navigation/Navigation';
import { getPlatformClient } from '@/resources/platform/client';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { time } from '@/utils/time';
import { ChainId } from '@rainbow-me/swaps';

type ClaimStatusPollResult = PollClaimStatusResult<ClaimRewardsResult, ClaimRewardsResponse>;

export type PreparedRewardsClaim = {
  address: Address;
  chainId: ChainId;
  intentId: string;
  signedIntent: string;
};

export type ClaimToDestination = 'wallet' | 'staking';

export async function prepareRewardsClaim({ address, signer }: { address: Address; signer?: Signer }): Promise<PreparedRewardsClaim> {
  // Only base is supported for now
  const chainId = ChainId.base;
  const startedAt = Date.now();
  const platformClient = getPlatformClient();

  let intentResponse: RainbowFetchResponse<GetClaimIntentResponse> | undefined;

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

    const signedIntent = await signIntent({ address, intent: intentResult.intent, chainId, signer });

    return {
      address,
      chainId,
      intentId,
      signedIntent,
    };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';

    analytics.track(analytics.event.rnbwRewardsClaimFailed, {
      chainId,
      intentId: intentResponse?.data?.result?.intentId,
      errorMessage,
      durationMs: Date.now() - startedAt,
      platformRequestIds: {
        intent: intentResponse?.headers?.get('x-request-id') ?? undefined,
      },
    });
    logger.error(new RainbowError('[prepareRewardsClaim]: Failed to prepare rewards claim', e));
    throw e;
  }
}

export async function submitRewardsClaim({
  preparedClaim,
  currency,
  claimToDestination = 'wallet',
}: {
  preparedClaim: PreparedRewardsClaim;
  currency: NativeCurrencyKey;
  claimToDestination?: ClaimToDestination;
}): Promise<ClaimRewardsResult> {
  const endpoint = claimToDestination === 'wallet' ? '/rewards/ClaimRewards' : '/staking/StakeRewards';
  const { address, chainId, intentId, signedIntent } = preparedClaim;
  const platformClient = getPlatformClient();

  let claimResponse: RainbowFetchResponse<ClaimRewardsResponse> | undefined;
  let pollResult: ClaimStatusPollResult | undefined;
  const startedAt = Date.now();

  try {
    claimResponse = await platformClient.post<ClaimRewardsResponse>(endpoint, {
      chainId: String(chainId),
      currency,
      walletAddress: address,
      intentId,
      intentSignature: signedIntent,
    });

    const claimResult = getPlatformResult(claimResponse, endpoint);
    const claimId = claimResult.claimId;
    if (!claimId) {
      throw new Error(`${endpoint} response is missing claimId`);
    }
    pollResult = await pollForClaimStatus({ claimId, address, currency, chainId, claimToDestination });
    const finalClaimResult = pollResult.result;

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
        claim: claimResponse?.headers?.get('x-request-id') ?? undefined,
        status: pollResult?.response?.headers?.get('x-request-id') ?? undefined,
      },
    });

    await useUserAssetsStore.getState().fetch(undefined, { force: true });
    setTimeout(() => useUserAssetsStore.getState().fetch(undefined, { force: true }), time.seconds(5));

    await useRewardsBalanceStore.getState().fetch(undefined, { force: true });

    return finalClaimResult;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    const lastStatus = pollResult?.response?.data?.result?.status ?? claimResponse?.data?.result?.status;

    analytics.track(analytics.event.rnbwRewardsClaimFailed, {
      chainId,
      intentId,
      claimId: claimResponse?.data?.result?.claimId,
      status: lastStatus,
      errorMessage,
      durationMs: Date.now() - startedAt,
      platformRequestIds: {
        claim: claimResponse?.headers?.get('x-request-id') ?? undefined,
        status: pollResult?.response?.headers?.get('x-request-id') ?? undefined,
      },
    });
    logger.error(new RainbowError('[submitRewardsClaim]: Failed to claim rewards', e));
    throw e;
  }
}

async function signIntent({
  address,
  intent,
  chainId,
  signer: existingSigner,
}: {
  address: Address;
  intent: GetClaimIntentResult['intent'];
  chainId: ChainId;
  signer?: Signer;
}) {
  const provider = getProvider({ chainId });
  const resolvedSigner = existingSigner ?? (await loadWallet({ address, provider }));
  if (!resolvedSigner) {
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
  const signedIntent = await signTypedDataMessage(messageToSign, provider, resolvedSigner);

  const isHardwareWalletNavigatorOpen = !existingSigner && resolvedSigner instanceof LedgerSigner;
  if (isHardwareWalletNavigatorOpen) {
    Navigation.goBack();
  }

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
  claimToDestination,
}: {
  claimId: string;
  address: Address;
  currency: NativeCurrencyKey;
  chainId: ChainId;
  claimToDestination: ClaimToDestination;
}): Promise<ClaimStatusPollResult> {
  const statusEndpoint = claimToDestination === 'wallet' ? '/rewards/GetClaimStatus' : '/staking/GetStakeStatus';
  return pollClaimStatus({
    fetchStatus: () =>
      getPlatformClient().get<ClaimRewardsResponse>(statusEndpoint, {
        params: {
          claimId,
          walletAddress: address,
          chainId: String(chainId),
          currency,
        },
      }),
    getResult: response => getPlatformResult(response, statusEndpoint),
  });
}
