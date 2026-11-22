import { base58 } from '@scure/base';

import * as keychain from '@/features/local-auth/keychain';
import { requireSolanaAddress, type SolanaAddress } from '@/features/solana/core/address';
import { decodeSolanaKey } from '@/features/wallet/core/solanaAccount';
import { type AccountPrivateKeyData } from '@/features/wallet/types';

const authenticationPrompt = { title: 'Authenticate to use Solana' };
const keyForAddress = (address: string) => `rainbow.account-key.v1/solana/${requireSolanaAddress(address, 'Invalid Solana address')}`;

export class SolanaAuthenticationCancelled extends Error {
  constructor() {
    super('Solana authentication was cancelled.');
  }
}

export async function readSolanaKey(address: string): Promise<Uint8Array> {
  const result = await keychain.getObject<AccountPrivateKeyData>(keyForAddress(address), { authenticationPrompt }).catch(() => {
    // JSON parser errors can include pieces of the stored secret.
    throw new Error('Unable to read the Solana key record.');
  });
  if (result.error === keychain.ErrorType.UserCanceled) throw new SolanaAuthenticationCancelled();
  if (result.error !== undefined) throw new Error('Unable to unlock the Solana key.');
  return decodeSolanaKey(result.value, address);
}

export async function saveSolanaKey(address: SolanaAddress, privateKey: Uint8Array): Promise<void> {
  const options = await keychain.getPrivateAccessControlOptions();
  const key = keyForAddress(address);
  // Do not pass a PIN in write options: the legacy wrapper logs those options.
  await keychain.setObject(
    key,
    {
      address,
      privateKey: base58.encode(privateKey),
      format: 'ed25519-seed-base58',
      version: 1,
    } satisfies AccountPrivateKeyData,
    { ...options, authenticationPrompt }
  );
}
