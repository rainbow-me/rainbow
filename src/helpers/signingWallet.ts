import { verifyMessage, Wallet } from '@ethersproject/wallet';
import { generateMnemonic } from 'bip39';
import { default as LibWallet } from 'ethereumjs-wallet';
// @ts-ignore
import { RAINBOW_MASTER_KEY } from 'react-native-dotenv';
import { loadString, saveString } from '../model/keychain';
import { loadWallet, publicAccessControlOptions } from '../model/wallet';
import {
  signingWalletAddress,
  signingWallet as signingWalletKeychain,
} from '../utils/keychainConstants';
import { EthereumAddress } from '@rainbow-me/entities';
import AesEncryptor from '@rainbow-me/handlers/aesEncryption';
import { addHexPrefix } from '@rainbow-me/handlers/web3';
import { ethereumUtils, logger } from '@rainbow-me/utils';

export async function getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded(): Promise<EthereumAddress> {
  let alreadyExistingWallet = await loadString(signingWalletAddress);

  if (typeof alreadyExistingWallet !== 'string') {
    const walletSeed = generateMnemonic();
    const {
      wallet,
      address,
    } = await ethereumUtils.deriveAccountFromWalletInput(walletSeed);

    const privateKey = addHexPrefix(
      (wallet as LibWallet).getPrivateKey().toString('hex')
    );

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
  address: EthereumAddress
): Promise<string | undefined> {
  let alreadyExistingEncodedSignature = await loadString(
    `signature_${address}`,
    publicAccessControlOptions
  );
  if (alreadyExistingEncodedSignature) {
    const publicKeyForTheSigningWallet = await getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded();
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
      return createSignature(address);
    }
  } else {
    return createSignature(address);
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

export async function createSignature(
  address: EthereumAddress,
  privateKey: string | null = null
) {
  logger.log('Creating a signature');
  const publicKeyForTheSigningWallet = await getPublicKeyOfTheSigningWalletAndCreateWalletIfNeeded();

  const mainWallet = privateKey
    ? new Wallet(privateKey)
    : await loadWallet(address, false);
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
