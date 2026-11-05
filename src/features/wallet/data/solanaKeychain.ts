import * as keychain from '@/features/local-auth/keychain';
import { requireSolanaAddress } from '@/features/solana/core/address';
import { decodeSolanaKey } from '@/features/wallet/core/solanaAccount';
import { type AccountPrivateKeyData } from '@/features/wallet/types';

const authenticationPrompt = { title: 'Authenticate to use Solana' };
const keyForAddress = (address: string) => `rainbow.account-key.v1/solana/${requireSolanaAddress(address, 'Invalid Solana address')}`;

export class SolanaAuthenticationCancelled extends Error {
  constructor() {
    super('Solana authentication was cancelled.');
  }
}

async function requirePrivateOptions() {
  const options = await keychain.getPrivateAccessControlOptions();
  // The legacy wrapper caches unprotected writes in MMKV, including on iOS simulators.
  if (!options.accessControl) throw new Error('Protected Solana storage requires a physical device with authentication enabled.');
  return options;
}

export async function readSolanaKey(address: string): Promise<Uint8Array> {
  await requirePrivateOptions();
  const result = await keychain.getObject(keyForAddress(address), { authenticationPrompt }).catch(() => {
    // JSON parser errors can include pieces of the stored secret.
    throw new Error('Unable to read the Solana key record.');
  });
  if (result.error === keychain.ErrorType.UserCanceled) throw new SolanaAuthenticationCancelled();
  if (result.error !== undefined) throw new Error('Unable to unlock the Solana key.');
  return decodeSolanaKey(result.value, address);
}

export async function saveSolanaKey(record: AccountPrivateKeyData): Promise<void> {
  const bytes = decodeSolanaKey(record, record.address);
  bytes.fill(0);
  const options = await requirePrivateOptions();
  const key = keyForAddress(record.address);
  if (await keychain.has(key)) {
    // A valid existing key for this address is already the desired record; never overwrite unreadable data.
    (await readSolanaKey(record.address)).fill(0);
    return;
  }
  // Do not pass a PIN in write options: the legacy wrapper logs those options.
  await keychain.setObject(
    key,
    {
      address: record.address,
      privateKey: record.privateKey,
      format: record.format,
      version: record.version,
    },
    { ...options, authenticationPrompt }
  );
  // The legacy setter returns void even when native persistence returns false.
  (await readSolanaKey(record.address)).fill(0);
}
