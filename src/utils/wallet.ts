import { NativeModules } from 'react-native';
import { hdkey } from 'ethereumjs-wallet';
import { Wallet } from '@ethersproject/wallet';
import { addHexPrefix, ensureChecksumAddress } from '@/handlers/web3';
import WalletTypes from '@/helpers/walletTypes';
import {
  DEFAULT_HD_PATH,
  identifyWalletType,
  WalletLibraryType,
  EthereumPrivateKey,
  EthereumWalletSeed,
  getHdPath,
  EthereumWalletFromSeed,
  ReadOnlyWallet,
} from '@/model/wallet';
import { mnemonicToSeed } from 'bip39';
import { IS_IOS } from '@/env';
import { getEthApp } from './ledger';

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

export const deriveAccountFromMnemonic = async (mnemonic: string, index = 0): Promise<EthereumWalletFromSeed> => {
  let seed;
  if (IS_IOS) {
    seed = await mnemonicToSeed(mnemonic);
  } else {
    const res = await RNBip39.mnemonicToSeed({ mnemonic, passphrase: null });
    seed = new Buffer(res, 'base64');
  }
  const hdWallet = hdkey.fromMasterSeed(seed);
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
