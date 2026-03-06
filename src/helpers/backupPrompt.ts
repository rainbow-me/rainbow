import walletBackupTypes from '@/helpers/walletBackupTypes';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import WalletTypes from '@/helpers/walletTypes';
import { type RainbowWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

export function canShowBackupPrompt(wallet: RainbowWallet | null): boolean {
  if (!wallet || wallet.backedUp || wallet.damaged) return false;
  if (wallet.type === WalletTypes.readOnly || wallet.type === WalletTypes.bluetooth) return false;

  return true;
}

export function getBackupPromptStep(backupProvider: string | undefined): string {
  if (backupProvider === walletBackupTypes.cloud) {
    return WalletBackupStepTypes.backup_prompt_cloud;
  }

  if (backupProvider === walletBackupTypes.manual) {
    return WalletBackupStepTypes.backup_prompt_manual;
  }

  return WalletBackupStepTypes.backup_prompt;
}

export function showBackupPrompt(backupProvider: string | undefined): void {
  Navigation.handleAction(Routes.BACKUP_SHEET, {
    step: getBackupPromptStep(backupProvider),
  });
}
