import { NativeModules } from 'react-native';
import { hdkey } from 'ethereumjs-wallet';
import { Wallet } from '@ethersproject/wallet';
import { addHexPrefix, toChecksumAddress } from '@/handlers/web3';
import WalletTypes from '@/helpers/walletTypes';
import { DEFAULT_HD_PATH, identifyWalletType, WalletLibraryType, EthereumPrivateKey, EthereumWalletSeed, getHdPath } from '@/model/wallet';
import { mnemonicToSeed } from 'bip39';
import { IS_IOS } from '@/env';
import { getEthApp } from './ledger';

const { RNBip39 } = NativeModules;

export const deriveAccountFromBluetoothHardwareWallet = async (deviceId: string, index = 0) => {
  const eth = await getEthApp(deviceId);
  const path = getHdPath({
    type: WalletLibraryType.ledger,
    index: Number(index),
  });
  const { address } = await eth.getAddress(path, false);
  const wallet = {
    address: toChecksumAddress(address),
    privateKey: `${deviceId}/${index}`,
  };

  return {
    address: wallet.address,
    isHDWallet: false,
    root: null,
    type: WalletTypes.bluetooth,
    wallet,
    walletType: WalletLibraryType.ledger,
  };
};

export const deriveAccountFromMnemonic = async (mnemonic: string, index = 0) => {
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
    address: toChecksumAddress(wallet.getAddress().toString('hex')),
    isHDWallet: true,
    root,
    type: WalletTypes.mnemonic,
    wallet,
    walletType: WalletLibraryType.bip39,
  };
};

export const deriveAccountFromPrivateKey = (privateKey: EthereumPrivateKey) => {
  const ethersWallet = new Wallet(addHexPrefix(privateKey));
  return {
    address: ethersWallet.address,
    isHDWallet: false,
    root: null,
    type: WalletTypes.privateKey,
    wallet: ethersWallet,
    walletType: WalletLibraryType.ethers,
  };
};

export const deriveAccountFromWalletInput = (input: EthereumWalletSeed) => {
  const type = identifyWalletType(input);
  if (type === WalletTypes.privateKey) {
    return deriveAccountFromPrivateKey(input);
  } else if (type === WalletTypes.bluetooth) {
    return deriveAccountFromBluetoothHardwareWallet(input);
  } else if (type === WalletTypes.readOnly) {
    const ethersWallet = { address: addHexPrefix(input), privateKey: null };
    return {
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
