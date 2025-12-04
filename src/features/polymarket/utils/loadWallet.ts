import walletTypes from '@/helpers/walletTypes';
import { logger, RainbowError } from '@/logger';
import { getHdPath, isHardwareWalletKey, loadPrivateKey, WalletLibraryType } from '@/model/wallet';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { getWalletWithAccount } from '@/state/wallets/walletsStore';
import { createWalletClient, Hex, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as kc from '@/keychain';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { Provider } from '@ethersproject/providers';

export async function loadWallet(address: Hex, provider: Provider) {
  // checks if the address is a hardware wallet for proper handling
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

  const account = privateKeyToAccount(privateKey as Hex);
  const chain = useBackendNetworksStore.getState().getDefaultChains()[ChainId.polygon];

  return createWalletClient({
    account,
    chain,
    transport: http(useBackendNetworksStore.getState().getChainDefaultRpc(ChainId.polygon)),
  });
}
