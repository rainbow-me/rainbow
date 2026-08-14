import { type Address } from 'viem';

import { IS_CASH_MOCK } from '@/env';
import { ChainId } from '@/features/network/types/backendNetworks';
import { loadWallet } from '@/features/wallet/data/loadWallet';
import { getProvider } from '@/handlers/web3';
import { signPersonalMessage } from '@/model/wallet';

import { useCashAccountStore } from '../stores/cashAccountStore';
import { hasLinkedWalletInCache, useCashWalletStore, type LinkedWallet } from '../stores/cashWalletStore';
import { ensureAccessToken } from './cashSignInService';
import { linkWallet, listWallets, WalletSignatureMethod, type RampWallet } from './rampClient';

export type WalletLinkStatus = 'linked' | 'needsLink';

/**
 * Failure to produce the signature. `loadWallet` and `signPersonalMessage` have both already told
 * the user (a cancel is silent by design, a real failure gets an alert or the wallet error sheet),
 * so callers must stay quiet on this one.
 */
export class WalletSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WalletSignatureError';
  }
}

function normalize({ id, address }: RampWallet): LinkedWallet {
  return { id, address: address.toLowerCase() };
}

/** The exact string the backend rebuilds to recover the signer; see the `/ramp/wallets/link` spec. */
function buildLinkMessage({ userId, address, timestamp }: { userId: string; address: string; timestamp: number }): string {
  return `rainbow/${userId}/link-wallet/${address}/${timestamp}`;
}

export async function checkWalletLink(address: Address, abortController?: AbortController | null): Promise<WalletLinkStatus> {
  if (IS_CASH_MOCK) return 'linked';

  // Ahead of the cache lookup: the same token authorizes the buy order that follows either way.
  await ensureAccessToken('addCash');
  if (hasLinkedWalletInCache(address)) return 'linked';

  const wallets = await listWallets(abortController);
  useCashWalletStore.getState().setLinkedWallets(wallets.map(normalize));
  return hasLinkedWalletInCache(address) ? 'linked' : 'needsLink';
}

export async function linkWalletWithSignature(address: Address, abortController?: AbortController | null): Promise<void> {
  const { userId } = useCashAccountStore.getState();
  if (!userId) throw new Error('No cash account recorded on this device');

  const signedAddress = address.toLowerCase();

  const provider = getProvider({ chainId: ChainId.base });
  const signer = await loadWallet({ address, provider });
  if (!signer) throw new WalletSignatureError('Failed to load wallet');

  const timestamp = Math.floor(Date.now() / 1000);
  const signed = await signPersonalMessage(buildLinkMessage({ userId, address: signedAddress, timestamp }), provider, signer);
  if (!signed?.result) throw new WalletSignatureError(`Failed to sign the link message: ${signed?.error?.message ?? 'Unknown error'}`);

  const wallet = await linkWallet(
    {
      address: signedAddress,
      signature: { hexSignature: signed.result, method: WalletSignatureMethod.EthPersonalSign, timestamp: String(timestamp) },
    },
    abortController
  );
  useCashWalletStore.getState().addLinkedWallet(normalize(wallet));
}
