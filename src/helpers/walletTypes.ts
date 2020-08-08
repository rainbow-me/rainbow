import { EthereumWalletType } from '../model/wallet';

const walletTypes: AllWalletTypes = {
  mnemonic: 'mnemonic',
  privateKey: 'privateKey',
  readOnly: 'readOnly',
  seed: 'seed',
};

export default walletTypes;

export interface AllWalletTypes {
  [key: string]: EthereumWalletType;
}
