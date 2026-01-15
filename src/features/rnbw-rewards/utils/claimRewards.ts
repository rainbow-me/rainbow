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
const CLAIM_POLL_TIMEOUT = time.seconds(30);
const CLAIM_PENDING_STATUSES = new Set(['CLAIM_STATUS_UNSPECIFIED', 'CLAIM_STATUS_PENDING']);
// TODO: Ask Maks for exact types
const CLAIM_FAILURE_STATUS_HINTS = ['FAILED', 'ERROR', 'REVERTED', 'CANCELED', 'CANCELLED', 'EXPIRED'];

export async function claimRewards({ address, currency }: { address: Address; currency: NativeCurrencyKey }) {
  // Only base is supported for now
  const chainId = ChainId.base;

  try {
    const intentResponse = await getPlatformClient().get<GetClaimIntentResponse>('/rewards/GetClaimIntent', {
      params: {
        walletAddress: address,
        chainId: String(chainId),
      },
    });

    const { intent, intentId } = getPlatformResult(intentResponse, 'GetClaimIntent');
    if (!intent || !intentId) {
      throw new Error('GetClaimIntent response is missing intent data');
    }

    const signedIntent = await signIntent({ address, intent, chainId });

    const claimResponse = await getPlatformClient().post<ClaimRewardsResponse>('/rewards/ClaimRewards', {
      chainId: String(chainId),
      currency,
      walletAddress: address,
      intentId,
      intentSignature: signedIntent,
    });

    const claimResult = getPlatformResult(claimResponse, 'ClaimRewards');
    if (!claimResult.claimId) {
      throw new Error('ClaimRewards response is missing claimId');
    }
    if (claimResult.errorMessage) {
      throw new Error(`${claimResult.errorMessage}`);
    }

    await pollForClaimStatus({ claimId: claimResult.claimId, address, currency, chainId });

    await useRnbwRewardsStore.getState().fetch(undefined, { force: true });

    return claimResult;
  } catch (e) {
    logger.error(new RainbowError('[claimRewards]: Failed to claim rewards', e));
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
}) {
  const fetchClaimStatus = async () => {
    return await getPlatformClient().get<ClaimRewardsResponse>('/rewards/GetClaimStatus', {
      params: {
        claimId,
        walletAddress: address,
        chainId: String(chainId),
        currency,
      },
    });
  };
  const startedAt = Date.now();
  let claimResponse = await fetchClaimStatus();

  let claimResult = getPlatformResult(claimResponse, 'GetClaimStatus');
  let status = claimResult.status;

  while (status && CLAIM_PENDING_STATUSES.has(status)) {
    if (Date.now() - startedAt > CLAIM_POLL_TIMEOUT) {
      throw new Error('Timed out waiting for claim status');
    }
    await delay(CLAIM_POLL_INTERVAL);
    claimResponse = await fetchClaimStatus();
    claimResult = getPlatformResult(claimResponse, 'GetClaimStatus');
    status = claimResult.status;
  }

  if (!status) {
    throw new Error('Claim status missing in response');
  }
  if (claimResult.errorMessage) {
    throw new Error(claimResult.errorMessage);
  }
  if (CLAIM_FAILURE_STATUS_HINTS.some(fragment => status.includes(fragment))) {
    throw new Error(`Claim failed with status: ${status}`);
  }

  return claimResult;
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
