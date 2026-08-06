import { EthereumWalletType } from '@/helpers/walletTypes';
import { logger, RainbowError } from '@/logger';
import { getSeedPhrase, identifyWalletType } from '@/model/wallet';
import { mnemonicToSeedBytes } from '@/utils/wallet';

import { deriveSolanaSigner, type SolanaSigner } from '../derivation';

/**
 * Loads the Solana signer for one account of one wallet, from the keychain.
 *
 * **This is the only IO in the send route that touches the authentication path, and it
 * adds no new boundary.** `getSeedPhrase` already reads the seed phrase behind the
 * keychain's `authenticationPrompt`, which is the gate the app's existing EVM signing
 * goes through; deriving a second curve from an already-unlocked seed reuses that gate
 * rather than introducing one. It is still a security-sensitive path, and two properties
 * of it are deliberate:
 *
 * - The seed bytes and the derived private key never leave this function or the closure
 *   `deriveSolanaSigner` returns. Nothing is logged, returned or persisted.
 * - It returns `null` rather than throwing when the user cancels the biometric prompt,
 *   because `getSeedPhrase` already turns that into `null` and a cancelled prompt is a
 *   choice rather than a fault.
 *
 * **Only a mnemonic wallet can produce a Solana signer.** A wallet imported as a private
 * key holds one secp256k1 key with no seed behind it, so there is nothing to derive an
 * ed25519 key from, and a hardware wallet's key never leaves the device. Those return
 * `null` too: the honest answer is that this wallet has no Solana account, not that the
 * derivation failed. The check necessarily runs **after** the keychain read, because
 * `identifyWalletType` classifies the secret itself and there is nothing to classify until
 * it has been read.
 *
 * **One `null` is not quiet, and a caller should know which.** For a wallet whose keychain
 * entry is missing altogether — a damaged wallet, per `getIsDamagedWallet` — `getSeedPhrase`
 * navigates to `WALLET_ERROR_SHEET` before returning `null` (`src/model/wallet.ts:1187`).
 * That is inherited from the shared read rather than chosen here, and it is not suppressed,
 * because suppressing it would mean not using the app's own seed-phrase accessor. So this
 * function returning `null` can mean "no Solana account for this wallet type", "the user
 * cancelled", or "the app has just shown an error sheet".
 */
export async function loadSolanaSigner(args: {
  readonly walletId: string;
  readonly accountIndex: number;
  /**
   * Forwarded to the keychain read. Both of `getSeedPhrase`'s existing callers in
   * `src/model/wallet.ts` pass it, and on an Android device that has one set the read
   * fails without it, so omitting it here would make this function return `null` on
   * exactly those devices and look like a wallet with no Solana account.
   */
  readonly androidEncryptionPin?: string;
}): Promise<SolanaSigner | null> {
  const { walletId, accountIndex, androidEncryptionPin } = args;

  const seedPhraseData = await getSeedPhrase(walletId, { androidEncryptionPin });
  if (!seedPhraseData?.seedphrase) return null;

  if (identifyWalletType(seedPhraseData.seedphrase) !== EthereumWalletType.mnemonic) {
    logger.warn('[loadSolanaSigner] wallet has no seed phrase to derive a Solana account from');
    return null;
  }

  try {
    const seed = await mnemonicToSeedBytes(seedPhraseData.seedphrase);
    return deriveSolanaSigner(seed, accountIndex);
  } catch (error) {
    logger.error(new RainbowError('[loadSolanaSigner] failed to derive a Solana signer', error));
    return null;
  }
}
