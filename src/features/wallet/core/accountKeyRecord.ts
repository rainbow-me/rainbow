import { getAddress } from '@ethersproject/address';
import { computeAddress } from '@ethersproject/transactions';
import { ed25519 } from '@noble/curves/ed25519';
import { base64 } from '@scure/base';

import { base58Encode, isSolanaAddress } from '@/features/solana/core/address';
import {
  type AccountPrivateKeyData,
  type SupportedCaipNamespace,
  type WalletAccessResult,
  type WalletAddress,
} from '@/features/wallet/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

type ValidatedWalletAddress = {
  address: WalletAddress;
  namespace: SupportedCaipNamespace;
};

/** Accept raw addresses only; network-qualified identifiers belong at integration boundaries. */
export function validateWalletAddress(value: unknown): WalletAccessResult<ValidatedWalletAddress> {
  if (typeof value !== 'string') return { status: 'invalid-record' };
  if (/^0x[0-9a-fA-F]{40}$/.test(value)) {
    return { status: 'ok', value: { address: getAddress(value.toLowerCase()), namespace: 'eip155' } };
  }
  if (isSolanaAddress(value)) return { status: 'ok', value: { address: value, namespace: 'solana' } };
  return { status: 'invalid-record' };
}

/** Decode untrusted persisted data and copy only the address-bound v1 fields. */
export function validateAccountKeyRecord(value: unknown): WalletAccessResult<AccountPrivateKeyData> {
  if (!isRecord(value) || value.version !== 1 || typeof value.privateKey !== 'string') return { status: 'invalid-record' };
  const identity = validateWalletAddress(value.address);
  if (identity.status !== 'ok') return identity;
  const { namespace, address } = identity.value;
  let bytes: Uint8Array | undefined;
  try {
    let keyAddress: string;
    if (namespace === 'eip155' && value.format === 'secp256k1-private-key-hex' && /^0x[0-9a-f]{64}$/.test(value.privateKey)) {
      keyAddress = computeAddress(value.privateKey);
    } else if (namespace === 'solana' && value.format === 'ed25519-seed-base64' && value.privateKey.length === 44) {
      bytes = base64.decode(value.privateKey);
      if (bytes.length !== 32 || base64.encode(bytes) !== value.privateKey) return { status: 'invalid-record' };
      keyAddress = base58Encode(ed25519.getPublicKey(bytes));
    } else {
      return { status: 'invalid-record' };
    }
    if (keyAddress !== address) return { status: 'address-mismatch' };
    return { status: 'ok', value: { address, privateKey: value.privateKey, format: value.format, version: 1 } };
  } catch {
    return { status: 'invalid-record' };
  } finally {
    bytes?.fill(0);
  }
}
