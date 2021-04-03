import { verifyMessage, Wallet } from '@ethersproject/wallet';
import lang from 'i18n-js';
// @ts-ignore
import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';
import { loadString, saveString } from '../model/keychain';
import * as keychain from '../model/keychain';
import { PrivateKeyData, publicAccessControlOptions } from '../model/wallet';
import { privateKeyKey } from '../utils/keychainConstants';
import AesEncryptor from '@rainbow-me/handlers/aesEncryption';
import { logger } from '@rainbow-me/utils';

const authenticationPrompt = lang.t('wallet.authenticate.please');

export async function getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded(): Promise<string> {
  let alreadyExistingWallet = await loadString('signing_wallet_address');
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
      'signing_wallet',
      encryptedPrivateKey,
      publicAccessControlOptions
    );

    await saveString(
      'signing_wallet_address',
      address,
      publicAccessControlOptions
    );
    alreadyExistingWallet = address;
  }
  logger.log('Signing wallet already existing');
  return alreadyExistingWallet;
}

export async function getASignatureForSigningWalletAndCreateSignatureIfNeeded(
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
      logger.log('Signature is not matching. Creating a new one.');
      alreadyExistingEncodedSignature = null;
    }
  }
  if (!alreadyExistingEncodedSignature) {
    const key = `${address}_${privateKeyKey}`;

    const pkey = (await keychain.loadObject(key, {
      authenticationPrompt,
    })) as PrivateKeyData | -2;
    logger.log('Creating a signature');
    if (pkey !== -2) {
      const { privateKey } = pkey;

      const mainWallet = new Wallet(privateKey);
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
  const encryptedPrivateKeyOfTheSigningWaller = await loadString(
    'signing_wallet',
    publicAccessControlOptions
  );
  const encryptor = new AesEncryptor();
  const decryptedPrivateKeyOfTheSigningWaller = await encryptor.decrypt(
    RAINBOW_MASTER_KEY,
    encryptedPrivateKeyOfTheSigningWaller
  );
  logger.log('Signing with a signing wallet.');

  const signingWallet = new Wallet(decryptedPrivateKeyOfTheSigningWaller);
  const signitureOfTheMessage = signingWallet.signMessage(messageToSign);
  return signitureOfTheMessage;
}
