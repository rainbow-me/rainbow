import walletTypes from '@/helpers/walletTypes';
import { logger, RainbowError } from '@/logger';
import { getHdPath, isHardwareWalletKey, loadPrivateKey, WalletLibraryType } from '@/model/wallet';
import { ChainId } from '@/state/backendNetworks/types';
import { getWalletWithAccount } from '@/state/wallets/walletsStore';
import { Wallet } from 'ethers';
import { Hex } from 'viem';
import * as kc from '@/keychain';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { getProvider } from '@/handlers/web3';
import { Provider } from '@ethersproject/providers';

export async function loadViemWallet(address: Hex, provider: Provider) {
  const selectedWallet = getWalletWithAccount(address);
  const isHardwareWallet = selectedWallet?.type === walletTypes.bluetooth;

  const privateKey = await loadPrivateKey(address, isHardwareWallet);

  if (!privateKey) {
    logger.error(new RainbowError('[loadWallet] Failed to load private key for signing'));
    return null;
  }

  if (privateKey === kc.ErrorType.UserCanceled || privateKey === kc.ErrorType.NotAuthenticated) {
    return null;
  }

  if (isHardwareWalletKey(privateKey)) {
    const index = privateKey?.split('/')[1];
    const deviceId = privateKey?.split('/')[0];
    if (typeof index !== undefined && deviceId) {
      return new LedgerSigner(provider, getHdPath({ type: WalletLibraryType.ledger, index: Number(index) }), deviceId);
    }
  }

  return new Wallet(privateKey as Hex, provider || getProvider({ chainId: ChainId.polygon }));
}
