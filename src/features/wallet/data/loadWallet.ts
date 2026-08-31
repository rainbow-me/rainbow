import { type Provider } from '@ethersproject/providers';
import { Wallet } from '@ethersproject/wallet';

import { type EthereumAddress } from '@/entities/wallet';
import { LedgerSigner } from '@/features/hardware-wallet/utils/LedgerSigner';
import { ErrorType } from '@/features/local-auth/keychain';
import { isHardwareWalletKey } from '@/features/wallet/core/hardwareWalletKey';
import { getHdPath, WalletLibraryType } from '@/features/wallet/core/walletLibrary';
import { loadAddress, loadPrivateKey } from '@/features/wallet/data/walletKeychain';
import walletTypes from '@/helpers/walletTypes';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { executeFn, type ExecuteFnParams, type Screen } from '@/state/performance/performance';
import { getWalletWithAccount, setWalletDamaged } from '@/state/wallets/walletsStore';

/** Loads the requested account's software or hardware signer from the keychain. */
export async function loadWallet<S extends Screen>({
  address,
  provider,
  timeTracking,
}: {
  address?: EthereumAddress;
  provider: Provider;
  timeTracking?: ExecuteFnParams<S>;
}): Promise<Wallet | LedgerSigner | null> {
  const addressToUse = address || (await loadAddress());
  if (!addressToUse) return null;

  const selectedWallet = getWalletWithAccount(addressToUse);
  const isHardwareWallet = selectedWallet?.type === walletTypes.bluetooth;
  const privateKey = timeTracking
    ? await executeFn(loadPrivateKey, timeTracking)(addressToUse, isHardwareWallet)
    : await loadPrivateKey(addressToUse, isHardwareWallet);

  if (privateKey === ErrorType.UserCanceled) return null;

  if (selectedWallet) {
    setWalletDamaged(selectedWallet.id, !privateKey || privateKey === ErrorType.NotAuthenticated);
  }

  if (privateKey !== ErrorType.NotAuthenticated) {
    if (isHardwareWallet && isHardwareWalletKey(privateKey)) {
      const [deviceId, index] = privateKey.split('/');
      if (deviceId && index !== undefined) {
        return new LedgerSigner(provider, getHdPath({ type: WalletLibraryType.ledger, index: Number(index) }), deviceId);
      }
    } else if (!isHardwareWallet && privateKey) {
      return new Wallet(privateKey, provider);
    }
  }

  Navigation.handleAction(Routes.WALLET_ERROR_SHEET);
  return null;
}
