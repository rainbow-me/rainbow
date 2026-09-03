import { NativeModules, Platform } from 'react-native';

import { Wallet } from '@ethersproject/wallet';
import { mnemonicToSeed } from 'bip39';
import { hdkey } from 'ethereumjs-wallet';

import { getEthApp } from '@/features/hardware-wallet/utils/ledger';
import {
  identifyWalletType,
  type EthereumPrivateKey,
  type EthereumWalletFromSeed,
  type EthereumWalletSeed,
  type ReadOnlyWallet,
} from '@/features/wallet/core/walletDerivation';
import { DEFAULT_HD_PATH, getHdPath, WalletLibraryType } from '@/features/wallet/core/walletLibrary';
import { addHexPrefix, ensureChecksumAddress } from '@/handlers/web3';
import WalletTypes from '@/helpers/walletTypes';

const { RNBip39 } = NativeModules;

export const deriveAccountFromBluetoothHardwareWallet = async (deviceId: string, index = 0): Promise<EthereumWalletFromSeed> => {
  const eth = await getEthApp(deviceId);
  const path = getHdPath({
    type: WalletLibraryType.ledger,
    index: Number(index),
  });
  const { address } = await eth.getAddress(path, false);

  const wallet: ReadOnlyWallet = {
    address: ensureChecksumAddress(address),
    privateKey: `${deviceId}/${index}`,
  };

  return {
    hdnode: null,
    address: wallet.address || '',
    isHDWallet: false,
    root: null,
    type: WalletTypes.bluetooth,
    wallet,
    walletType: WalletLibraryType.ledger,
  };
};

/**
 * Turns a BIP-39 mnemonic into its seed bytes.
 *
 * This step is chain-family-agnostic: the seed it produces is the input to any curve's
 * derivation, and only what happens next is EVM-shaped. It is extracted so that a
 * second chain family reuses it rather than restating the platform split, which is the
 * part that would rot: iOS goes through `bip39`, Android through a native module, and
 * the two must agree byte for byte for the same mnemonic.
 *
 * The Android branch hands back a `Buffer`. `Buffer` extends `Uint8Array`, so returning
 * it under this signature is sound and no conversion is needed; what matters is that
 * the declared type is `Uint8Array`, so no `Buffer` propagates into a caller that
 * should not know about one.
 */
export const mnemonicToSeedBytes = async (mnemonic: string): Promise<Uint8Array> => {
  if (Platform.OS === 'ios') {
    return mnemonicToSeed(mnemonic);
  }
  const res = await RNBip39.mnemonicToSeed({ mnemonic, passphrase: null });
  return new Buffer(res, 'base64');
};

export const deriveAccountFromMnemonic = async (mnemonic: string, index = 0): Promise<EthereumWalletFromSeed> => {
  const seed = await mnemonicToSeedBytes(mnemonic);
  const hdWallet = hdkey.fromMasterSeed(Buffer.from(seed));
  const root = hdWallet.derivePath(DEFAULT_HD_PATH);
  const child = root.deriveChild(index);
  const wallet = child.getWallet();
  return {
    address: ensureChecksumAddress(wallet.getAddress().toString('hex')),
    isHDWallet: true,
    root,
    type: WalletTypes.mnemonic,
    hdnode: null,
    wallet,
    walletType: WalletLibraryType.bip39,
  };
};

export const deriveAccountFromPrivateKey = (privateKey: EthereumPrivateKey): EthereumWalletFromSeed => {
  const ethersWallet = new Wallet(addHexPrefix(privateKey));
  return {
    hdnode: null,
    address: ethersWallet.address,
    isHDWallet: false,
    root: null,
    type: WalletTypes.privateKey,
    wallet: ethersWallet,
    walletType: WalletLibraryType.ethers,
  };
};

export const deriveAccountFromWalletInput = async (input: EthereumWalletSeed): Promise<EthereumWalletFromSeed> => {
  const type = identifyWalletType(input);
  if (type === WalletTypes.privateKey) {
    return deriveAccountFromPrivateKey(input);
  } else if (type === WalletTypes.bluetooth) {
    return await deriveAccountFromBluetoothHardwareWallet(input);
  } else if (type === WalletTypes.readOnly) {
    const ethersWallet = { address: addHexPrefix(input), privateKey: null };
    return {
      hdnode: null,
      address: addHexPrefix(input),
      isHDWallet: false,
      root: null,
      type: WalletTypes.readOnly,
      wallet: ethersWallet,
      walletType: WalletLibraryType.ethers,
    };
  }
  return deriveAccountFromMnemonic(input);
};
