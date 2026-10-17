import { maybeAuthenticateWithPIN } from '@/features/local-auth/keychain';
import { deriveSolanaAddress, solanaDerivationPath } from '@/features/solana/core/derivation';
import { useIsSolanaEnabled } from '@/features/solana/hooks/useIsSolanaEnabled';
import { identifyWalletType } from '@/features/wallet/core/walletDerivation';
import { getSeedPhrase } from '@/features/wallet/data/walletKeychain';
import { EthereumWalletType } from '@/helpers/walletTypes';
import { getAccountAddress, getSelectedWallet } from '@/state/wallets/walletsStore';
import { mnemonicToSeedBytes } from '@/utils/wallet';

export async function deriveSelectedSolanaAddress() {
  if (!useIsSolanaEnabled.getState()) return null;

  const wallet = getSelectedWallet();
  const sourceAddress = getAccountAddress();
  const account = wallet?.addresses.find(account => account.address.toLowerCase() === sourceAddress.toLowerCase());
  if (wallet?.type !== EthereumWalletType.mnemonic || !account) {
    throw new Error('Select an account belonging to a recovery phrase wallet.');
  }

  const accountIndex = account.index;
  const derivationPath = solanaDerivationPath(accountIndex);
  const isCurrent = () => useIsSolanaEnabled.getState() && getSelectedWallet()?.id === wallet.id && getAccountAddress() === sourceAddress;

  let androidEncryptionPin;
  try {
    androidEncryptionPin = await maybeAuthenticateWithPIN();
  } catch (error) {
    // The existing PIN screen rejects without an error when the user cancels.
    if (error === undefined) return null;
    throw error;
  }
  if (!isCurrent()) return null;

  const secret = await getSeedPhrase(wallet.id, { androidEncryptionPin });
  if (!secret || !isCurrent()) return null;
  if (identifyWalletType(secret.seedphrase) !== EthereumWalletType.mnemonic) {
    throw new Error('This wallet does not contain a valid recovery phrase.');
  }

  const seed = await mnemonicToSeedBytes(secret.seedphrase);
  try {
    if (!isCurrent()) return null;
    return { address: deriveSolanaAddress(seed, accountIndex), accountIndex, derivationPath, sourceAddress };
  } finally {
    seed.fill(0);
  }
}
