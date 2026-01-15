import { analytics } from '@/analytics';
import { NativeCurrencyKey } from '@/entities';
import { useRnbwRewardsStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwRewardsStore';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { loadWallet, signTypedDataMessage } from '@/model/wallet';
import { getPlatformClient } from '@/resources/platform/client';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { ChainId } from '@rainbow-me/swaps';
import { Address } from 'viem';
import type {
  ClaimRewardsResponse,
  GetClaimIntentResponse,
  GetClaimIntentResult,
  PlatformResponseShape,
} from '@/features/rnbw-rewards/types/claimRewardsTypes';

const CLAIM_POLL_INTERVAL = time.seconds(1);
const CLAIM_POLL_TIMEOUT = time.minutes(1);
const CLAIM_PENDING_STATUSES = new Set(['CLAIM_STATUS_UNSPECIFIED', 'CLAIM_STATUS_PENDING']);
// TODO: Ask Maks for all exact types
const CLAIM_FAILURE_STATUSES = new Set(['CLAIM_STATUS_FAILED']);

type ClaimStatusPollResult = {
  attempts: number;
  response: { data?: ClaimRewardsResponse };
};

export async function claimRewards({ address, currency }: { address: Address; currency: NativeCurrencyKey }) {
  // Only base is supported for now
  const chainId = ChainId.base;
  const startedAt = Date.now();

  let intentResponse: { data?: GetClaimIntentResponse } | undefined;
  let claimResponse: { data?: ClaimRewardsResponse } | undefined;
  let pollResult: ClaimStatusPollResult | undefined;

  try {
    intentResponse = await getPlatformClient().get<GetClaimIntentResponse>('/rewards/GetClaimIntent', {
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

    claimResponse = await getPlatformClient().post<ClaimRewardsResponse>('/rewards/ClaimRewards', {
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
    if (claimResult.errorMessage) {
      throw new Error(`${claimResult.errorMessage}`);
    }

    pollResult = await pollForClaimStatus({ claimId, address, currency, chainId });
    const finalClaimResult = getPlatformResult(pollResult.response, 'GetClaimStatus');

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
        intent: intentResponse?.data?.metadata?.requestId,
        claim: claimResponse?.data?.metadata?.requestId,
        status: pollResult?.response?.data?.metadata?.requestId,
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
      pollAttempts: pollResult?.attempts ?? 0,
      platformRequestIds: {
        intent: intentResponse?.data?.metadata?.requestId,
        claim: claimResponse?.data?.metadata?.requestId,
        status: pollResult?.response?.data?.metadata?.requestId,
      },
    });
    logger.error(new RainbowError('[claimRewards]: Failed to claim rewards', e));
    throw e;
  }
}

async function signIntent({ address, intent, chainId }: { address: Address; intent: GetClaimIntentResult['intent']; chainId: ChainId }) {
  const provider = getProvider({ chainId });
  const signer = await loadWallet({ address, provider, showErrorIfNotLoaded: false });
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
  let attempts = 0;

  const fetchClaimStatus = async () => {
    const response = await getPlatformClient().get<ClaimRewardsResponse>('/rewards/GetClaimStatus', {
      params: {
        claimId,
        walletAddress: address,
        chainId: String(chainId),
        currency,
      },
    });
    attempts += 1;
    return response;
  };

  const startedAt = Date.now();
  let lastResponse = await fetchClaimStatus();
  let claimResult = getPlatformResult(lastResponse, 'GetClaimStatus');
  let status = claimResult.status;

  while (status && CLAIM_PENDING_STATUSES.has(status)) {
    if (Date.now() - startedAt > CLAIM_POLL_TIMEOUT) {
      throw new Error('Timed out waiting for claim status');
    }
    await delay(CLAIM_POLL_INTERVAL);
    lastResponse = await fetchClaimStatus();
    claimResult = getPlatformResult(lastResponse, 'GetClaimStatus');
    // eslint-disable-next-line require-atomic-updates
    status = claimResult.status;
  }

  if (!status) {
    throw new Error('Claim status missing in response');
  }
  if (claimResult.errorMessage) {
    throw new Error(claimResult.errorMessage);
  }
  if (CLAIM_FAILURE_STATUSES.has(status)) {
    throw new Error(`Claim failed with status: ${status}`);
  }

  return { attempts, response: lastResponse };
}

function getPlatformResult<T>(response: { data?: PlatformResponseShape<T> }, context: string): T {
  if (!response?.data) {
    throw new Error(`[${context}]: response is missing data`);
  }
  if (response.data.metadata?.success === false) {
    throw new Error(`[${context}]: response was unsuccessful`);
  }
  if (response.data.result == null) {
    throw new Error(`[${context}]: response is missing result`);
  }
  return response.data.result;
}
