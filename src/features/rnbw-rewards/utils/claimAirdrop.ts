import { analytics } from '@/analytics';
import { NativeCurrencyKey } from '@/entities';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { ClaimAirdropResponse, ClaimAirdropResult } from '@/features/rnbw-rewards/types/claimAirdropTypes';
import { getPlatformResult } from '@/features/rnbw-rewards/utils/getPlatformResult';
import { pollClaimStatus, PollClaimStatusResult } from '@/features/rnbw-rewards/utils/pollClaimStatus';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { loadWallet, signPersonalMessage } from '@/model/wallet';
import { RainbowFetchResponse } from '@/rainbow-fetch';
import { getPlatformClient } from '@/resources/platform/client';
import { ChainId } from '@rainbow-me/swaps';
import { Address } from 'viem';

type ClaimStatusPollResult = PollClaimStatusResult<ClaimAirdropResult, ClaimAirdropResponse>;

export async function claimAirdrop({ message, address, currency }: { message: string; address: Address; currency: NativeCurrencyKey }) {
  const chainId = ChainId.base;
  const startedAt = Date.now();
  const platformClient = getPlatformClient();

  let claimResponse: RainbowFetchResponse<ClaimAirdropResponse> | undefined;
  let pollResult: ClaimStatusPollResult | undefined;

  try {
    if (!address) {
      throw new Error('Missing wallet address');
    }

    if (!message) {
      throw new Error('Missing airdrop claim message');
    }

    const signedMessage = await signMessage({ message, address });

    claimResponse = await platformClient.post<ClaimAirdropResponse>('/rewards/ClaimAirdrop', {
      currency,
      walletAddress: address,
      messageSigned: signedMessage,
    });

    const claimResult = getPlatformResult(claimResponse, 'ClaimAirdrop');
    const claimId = claimResult.claimId;
    if (!claimId) {
      throw new Error('ClaimAirdrop response is missing claimId');
    }
    pollResult = await pollForClaimStatus({ claimId, address, currency, chainId });
    const finalClaimResult = pollResult.result;

    await useAirdropBalanceStore.getState().fetch(undefined, { force: true });

    analytics.track(analytics.event.rnbwAirdropClaim, {
      chainId,
      claimId,
      claimedRnbw: finalClaimResult.claimedRnbw,
      claimedValueInCurrency: finalClaimResult.claimedValueInCurrency,
      decimals: finalClaimResult.decimals,
      status: finalClaimResult.status,
      txHash: finalClaimResult.txHash ?? undefined,
      tenderlyUrl: finalClaimResult.tenderlyUrl ?? undefined,
      durationMs: Date.now() - startedAt,
      pollAttempts: pollResult.attempts,
      platformRequestIds: {
        claim: claimResponse.headers?.get('x-request-id') ?? undefined,
        status: pollResult.response.headers?.get('x-request-id') ?? undefined,
      },
    });

    return finalClaimResult;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    const lastStatus = pollResult?.response?.data?.result?.status ?? claimResponse?.data?.result?.status;

    analytics.track(analytics.event.rnbwAirdropClaimFailed, {
      chainId,
      claimId: claimResponse?.data?.result?.claimId,
      status: lastStatus,
      errorMessage,
      durationMs: Date.now() - startedAt,
      platformRequestIds: {
        claim: claimResponse?.headers?.get('x-request-id') ?? undefined,
        status: pollResult?.response?.headers?.get('x-request-id') ?? undefined,
      },
    });

    logger.error(new RainbowError('[claimAirdrop]: Failed to claim airdrop', e));
    throw e;
  }
}

async function signMessage({ message, address }: { message: string; address: Address }) {
  const provider = getProvider({ chainId: ChainId.base });
  const signer = await loadWallet({ address, provider });
  if (!signer) {
    throw new Error('Failed to load wallet');
  }
  const signedMessage = await signPersonalMessage(message, provider, signer);
  if (!signedMessage?.result || signedMessage?.error) {
    throw new Error(`Failed to sign message: ${signedMessage?.error?.message ?? 'Unknown error'}`);
  }
  return signedMessage.result;
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
      getPlatformClient().get<ClaimAirdropResponse>('/rewards/GetAirdropClaimStatus', {
        params: {
          claimId,
          walletAddress: address,
          chainId: String(chainId),
          currency,
        },
      }),
    getResult: response => getPlatformResult(response, 'GetAirdropClaimStatus'),
  });
}
