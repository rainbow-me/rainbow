import walletBackupTypes from '@/helpers/walletBackupTypes';
import { logger } from '@/logger';
import { AllRainbowWallets } from '@/model/wallet';
import { initializeWallet } from '@/state/wallets/initializeWallet';
import { loadWallets, setAllWalletsWithIdsAsBackedUp, setSelectedWallet } from '@/state/wallets/walletsStore';

export async function updateWalletsBackedUpState({
  filename,
  prevWalletsState,
}: {
  filename?: string;
  prevWalletsState?: AllRainbowWallets | void;
} = {}) {
  // we're abusing keychain here - restore writes to keychain, we re-read it
  // here later updateWalletsBackedUpState diffs the two and uses that to
  // determine if its backed up it's not great, just documenting how it is
  const newWalletsState = await loadWallets();
  const walletIdsToUpdate = Object.keys(newWalletsState || {}).filter(walletId => !(prevWalletsState || {})[walletId]);

  logger.debug('[RestoreCloudStep]: Updating backup state of wallets with ids', {
    walletIds: JSON.stringify(walletIdsToUpdate),
  });
  logger.debug(`[RestoreCloudStep]: Selected backup name: ${filename}`);

  await setAllWalletsWithIdsAsBackedUp(walletIdsToUpdate, walletBackupTypes.cloud, filename);

  const oldCloudIds: string[] = [];
  const oldManualIds: string[] = [];
  // NOTE: Looping over previous wallets and restoring backup state of that wallet
  Object.values(prevWalletsState || {}).forEach(wallet => {
    // NOTE: This handles cloud and manual backups
    if (wallet.backedUp && wallet.backupType === walletBackupTypes.cloud) {
      oldCloudIds.push(wallet.id);
    } else if (wallet.backedUp && wallet.backupType === walletBackupTypes.manual) {
      oldManualIds.push(wallet.id);
    }
  });

  await setAllWalletsWithIdsAsBackedUp(oldCloudIds, walletBackupTypes.cloud, filename);
  await setAllWalletsWithIdsAsBackedUp(oldManualIds, walletBackupTypes.manual, filename);

  const walletKeys = Object.keys(newWalletsState || {});
  const firstWallet = walletKeys.length > 0 ? (newWalletsState || {})[walletKeys[0]] : undefined;
  const firstAddress = firstWallet ? (firstWallet.addresses || [])[0].address : undefined;

  if (firstWallet) {
    await setSelectedWallet(firstWallet, firstAddress);
    await initializeWallet({
      shouldRunMigrations: false,
      overwrite: false,
      switching: true,
    });
  }
}
