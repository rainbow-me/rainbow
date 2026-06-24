import { type Provider } from '@ethersproject/providers';
import { createWalletClient, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { LedgerSigner } from '@/features/hardware-wallet/utils/LedgerSigner';
import * as kc from '@/features/local-auth/keychain';
import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import walletTypes from '@/helpers/walletTypes';
import { logger, RainbowError } from '@/logger';
import { getHdPath, isHardwareWalletKey, loadPrivateKey, WalletLibraryType } from '@/model/wallet';
import { getWalletWithAccount } from '@/state/wallets/walletsStore';

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

  const account = privateKeyToAccount(privateKey as Hex);
  const chain = useBackendNetworksStore.getState().getDefaultChains()[ChainId.polygon];

  return createWalletClient({
    account,
    chain,
    transport: http(useBackendNetworksStore.getState().getChainDefaultRpc(ChainId.polygon)),
  });
}
