import { analytics } from '@/analytics';
import { NativeCurrencyKey } from '@/entities';
import { useRnbwAirdropStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwAirdropStore';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { loadWallet, signPersonalMessage } from '@/model/wallet';
import type { RainbowFetchResponse } from '@/rainbow-fetch';
import { getPlatformClient } from '@/resources/platform/client';
import { ChainId } from '@rainbow-me/swaps';
import { Address } from 'viem';

type ClaimAirdropResponse = {
  chainId: string;
  claimId: string;
  claimedRnbw: string;
  claimedValueInCurrency: string;
  createdAt: string;
  decimals: number;
  errorMessage: string;
  processedAt: string;
  status: string;
  tenderlyUrl: string;
  txHash: string;
  walletAddress: string;
};

export async function claimAirdrop({ message, address, currency }: { message: string; address: Address; currency: NativeCurrencyKey }) {
  const chainId = ChainId.base;
  const startedAt = Date.now();
  const platformClient = getPlatformClient();

  let claimResponse: RainbowFetchResponse<ClaimAirdropResponse> | undefined;

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

    const claimResult = claimResponse.data;
    if (claimResult.errorMessage) {
      throw new Error(claimResult.errorMessage);
    }

    await useRnbwAirdropStore.getState().fetch(undefined, { force: true });

    analytics.track(analytics.event.rnbwAirdropClaim, {
      chainId,
      claimId: claimResult.claimId,
      claimedRnbw: claimResult.claimedRnbw,
      claimedValueInCurrency: claimResult.claimedValueInCurrency,
      decimals: claimResult.decimals,
      status: claimResult.status,
      txHash: claimResult.txHash,
      tenderlyUrl: claimResult.tenderlyUrl,
      durationMs: Date.now() - startedAt,
      platformRequestId: claimResponse.headers?.get('x-request-id') ?? undefined,
    });

    return claimResult;
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';

    analytics.track(analytics.event.rnbwAirdropClaimFailed, {
      chainId,
      claimId: claimResponse?.data?.claimId,
      status: claimResponse?.data?.status,
      errorMessage,
      durationMs: Date.now() - startedAt,
      platformRequestId: claimResponse?.headers?.get('x-request-id') ?? undefined,
    });

    logger.error(new RainbowError('[claimAirdrop]: Failed to claim airdrop', e));
    throw e;
  }
}

async function signMessage({ message, address }: { message: string; address: Address }) {
  const provider = getProvider({ chainId: ChainId.base });
  const signer = await loadWallet({ address, provider, showErrorIfNotLoaded: false });
  if (!signer) {
    throw new Error('Failed to load wallet');
  }
  const signedMessage = await signPersonalMessage(message, provider, signer);
  if (!signedMessage?.result || signedMessage?.error) {
    throw new Error(`Failed to sign message: ${signedMessage?.error?.message ?? 'Unknown error'}`);
  }
  return signedMessage.result;
}
