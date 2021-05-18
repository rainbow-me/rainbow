import { verifyMessage, Wallet } from '@ethersproject/wallet';
// @ts-ignore
import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';
import { loadString, saveString } from '../model/keychain';
import { loadWallet, publicAccessControlOptions } from '../model/wallet';
import {
  signingWalletAddress,
  signingWallet as signingWalletKeychain,
} from '../utils/keychainConstants';
import AesEncryptor from '@rainbow-me/handlers/aesEncryption';
import { logger } from '@rainbow-me/utils';

export async function getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded(): Promise<string> {
  let alreadyExistingWallet = await loadString(signingWalletAddress);
  if (typeof alreadyExistingWallet !== 'string') {
    const wallet = Wallet.createRandom();
    logger.log('Created signing wallet');
    const { privateKey, address } = wallet;
    const encryptor = new AesEncryptor();
    const encryptedPrivateKey = (await encryptor.encrypt(
      RAINBOW_MASTER_KEY,
      privateKey
    )) as string;

    await saveString(
      signingWalletKeychain,
      encryptedPrivateKey,
      publicAccessControlOptions
    );

    await saveString(signingWalletAddress, address, publicAccessControlOptions);
    alreadyExistingWallet = address;
  }
  logger.log('Signing wallet already existing');
  return alreadyExistingWallet;
}

export async function getSignatureForSigningWalletAndCreateSignatureIfNeeded(
  address: string
): Promise<string | undefined> {
  const publicKeyForTheSigningWallet = await getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded();
  let alreadyExistingEncodedSignature = await loadString(
    `signature_${address}`,
    publicAccessControlOptions
  );
  if (alreadyExistingEncodedSignature) {
    const encryptor = new AesEncryptor();
    const decryptedSignature = await encryptor.decrypt(
      RAINBOW_MASTER_KEY,
      alreadyExistingEncodedSignature
    );
    if (
      address ===
      verifyMessage(publicKeyForTheSigningWallet, decryptedSignature)
    ) {
      return decryptedSignature;
    } else {
      logger.log('Signature does not match. Creating a new one.');
      alreadyExistingEncodedSignature = null;
    }
  } else {
    logger.log('Creating a signature');

    const mainWallet = await loadWallet(address, false);
    if (mainWallet) {
      const signatureForSigningWallet = await mainWallet.signMessage(
        publicKeyForTheSigningWallet
      );

      const encryptor = new AesEncryptor();
      const encryptedSignature = (await encryptor.encrypt(
        RAINBOW_MASTER_KEY,
        signatureForSigningWallet
      )) as string;

      await saveString(
        `signature_${address}`,
        encryptedSignature,
        publicAccessControlOptions
      );
      logger.log('Saved a new signature for signing wallet.');

      return signatureForSigningWallet;
    }
    return undefined;
  }
}

export async function signWithSigningWallet(
  messageToSign: string
): Promise<string> {
  const encryptedPrivateKeyOfTheSigningWallet = await loadString(
    signingWalletKeychain,
    publicAccessControlOptions
  );
  const encryptor = new AesEncryptor();
  const decryptedPrivateKeyOfTheSigningWallet = await encryptor.decrypt(
    RAINBOW_MASTER_KEY,
    encryptedPrivateKeyOfTheSigningWallet
  );
  logger.log('Signing with a signing wallet.');

  const signingWallet = new Wallet(decryptedPrivateKeyOfTheSigningWallet);
  return signingWallet.signMessage(messageToSign);
}
