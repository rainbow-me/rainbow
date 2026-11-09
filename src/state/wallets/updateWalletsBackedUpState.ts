import { type AllRainbowWallets } from '@/features/wallet/types';
import { ensureValidHex } from '@/handlers/web3';
import walletBackupTypes from '@/helpers/walletBackupTypes';
import { logger } from '@/logger';
import { switchWallet } from '@/state/wallets/switchWallet';
import { getWallets, setAllWalletsWithIdsAsBackedUp } from '@/state/wallets/walletsStore';

export async function updateWalletsBackedUpState({
  filename,
  prevWalletsState,
}: {
  filename?: string;
  prevWalletsState?: AllRainbowWallets | void;
} = {}) {
  // NOTE: Marking the restored wallets as backed up
  const newWalletsState = getWallets();
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

  if (firstWallet && firstAddress) {
    await switchWallet(ensureValidHex(firstAddress), firstWallet.id);
  }
}
