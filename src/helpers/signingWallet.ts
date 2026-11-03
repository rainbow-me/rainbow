import { verifyMessage, Wallet } from '@ethersproject/wallet';
import { generateMnemonic } from 'bip39';
import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';

import type { EthereumAddress } from '@/entities/wallet';
import { signingWalletAddress, signingWallet as signingWalletKeychain } from '@/features/local-auth/keychainConstants';
import { loadString, publicAccessControlOptions, saveString } from '@/features/local-auth/legacyKeychain';
import { ChainId } from '@/features/network/types/backendNetworks';
import { loadWallet } from '@/features/wallet/data/loadWallet';
import AesEncryptor from '@/handlers/aesEncryption';
import { addHexPrefix, getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { deriveAccountFromMnemonic } from '@/utils/wallet';

export async function getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded(): Promise<EthereumAddress | null> {
  let alreadyExistingWallet = await loadString(signingWalletAddress);

  if (typeof alreadyExistingWallet !== 'string') {
    const walletSeed = generateMnemonic();
    const { wallet, address } = await deriveAccountFromMnemonic(walletSeed);

    const privateKey = addHexPrefix(wallet.getPrivateKey().toString('hex'));

    const encryptor = new AesEncryptor();
    const encryptedPrivateKey = await encryptor.encrypt(RAINBOW_MASTER_KEY, privateKey);
    if (typeof encryptedPrivateKey !== 'string') {
      logger.error(new RainbowError('[signingWallet]: Failed to encrypt signing wallet private key'));
      return null;
    }

    await saveString(signingWalletKeychain, encryptedPrivateKey, publicAccessControlOptions);

    await saveString(signingWalletAddress, address, publicAccessControlOptions);
    alreadyExistingWallet = address;
  }
  logger.debug('[signingWallet]: Signing wallet already existing');
  return alreadyExistingWallet;
}

export async function getSignatureForSigningWalletAndCreateSignatureIfNeeded(address: EthereumAddress): Promise<string | undefined> {
  let alreadyExistingEncodedSignature = await loadString(`signature_${address}`, publicAccessControlOptions);
  if (typeof alreadyExistingEncodedSignature === 'string') {
    const publicKeyForTheSigningWallet = await getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded();
    if (!publicKeyForTheSigningWallet) return;
    const encryptor = new AesEncryptor();
    const decryptedSignature = await encryptor.decrypt(RAINBOW_MASTER_KEY, alreadyExistingEncodedSignature);
    if (typeof decryptedSignature === 'string' && address === verifyMessage(publicKeyForTheSigningWallet, decryptedSignature)) {
      return decryptedSignature;
    } else {
      logger.debug('[signingWallet]: Signature does not match. Creating a new one.');
      alreadyExistingEncodedSignature = null;
      return createSignature(address);
    }
  } else {
    return createSignature(address);
  }
}

export async function signWithSigningWallet(messageToSign: string): Promise<string> {
  const encryptedPrivateKeyOfTheSigningWallet = await loadString(signingWalletKeychain, publicAccessControlOptions);
  if (typeof encryptedPrivateKeyOfTheSigningWallet !== 'string') {
    throw new Error('[signingWallet]: Signing wallet private key is unavailable');
  }
  const encryptor = new AesEncryptor();
  const decryptedPrivateKeyOfTheSigningWallet = await encryptor.decrypt(RAINBOW_MASTER_KEY, encryptedPrivateKeyOfTheSigningWallet);
  if (typeof decryptedPrivateKeyOfTheSigningWallet !== 'string') {
    throw new Error('[signingWallet]: Failed to decrypt signing wallet private key');
  }
  logger.debug('[signingWallet]: Signing with a signing wallet.');

  const signingWallet = new Wallet(decryptedPrivateKeyOfTheSigningWallet);
  return signingWallet.signMessage(messageToSign);
}

export async function createSignature(address: EthereumAddress, privateKey: string | null = null): Promise<string | undefined> {
  logger.debug('[signingWallet]: Creating a signature');
  const publicKeyForTheSigningWallet = await getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded();
  if (!publicKeyForTheSigningWallet) return;

  const provider = getProvider({ chainId: ChainId.mainnet });
  const mainWallet = privateKey ? new Wallet(privateKey) : await loadWallet({ address, provider });
  if (mainWallet) {
    const signatureForSigningWallet = await mainWallet.signMessage(publicKeyForTheSigningWallet);

    const encryptor = new AesEncryptor();
    const encryptedSignature = await encryptor.encrypt(RAINBOW_MASTER_KEY, signatureForSigningWallet);
    if (typeof encryptedSignature !== 'string') {
      throw new Error('[signingWallet]: Failed to encrypt signing wallet signature');
    }

    await saveString(`signature_${address}`, encryptedSignature, publicAccessControlOptions);
    logger.debug('[signingWallet]: Saved a new signature for signing wallet.');

    return signatureForSigningWallet;
  }
  return undefined;
}
