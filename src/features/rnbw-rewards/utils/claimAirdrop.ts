import { NativeCurrencyKey } from '@/entities';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { signPersonalMessage } from '@/model/wallet';
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
  try {
    const platformClient = getPlatformClient();
    const signedMessage = await signPersonalMessage(message, getProvider({ chainId: ChainId.base }));
    let claimResponse = await platformClient.post<ClaimAirdropResponse>('/rewards/ClaimAirdrop', {
      currency,
      walletAddress: address,
      messageSigned: signedMessage,
    });
    console.log('claim response', JSON.stringify(claimResponse, null, 2));
  } catch (e) {
    logger.error(new RainbowError('[claimAirdrop]: Failed to claim airdrop', e));
  }
}
