import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect } from 'react';
import { BackupCloudStep, RestoreCloudStep } from '.';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import BackupWalletPrompt from '@/components/backup/BackupWalletPrompt';
import ManualBackupPrompt from '@/components/backup/ManualBackupPrompt';
import { BackgroundProvider } from '@/design-system';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { getHeightForStep } from '@/navigation/config';
import CloudBackupPrompt from './CloudBackupPrompt';
import { backupsStore } from '@/state/backups/backups';

type BackupSheetParams = {
  BackupSheet: {
    longFormHeight?: number;
    missingPassword?: boolean;
    step?: string;
    walletId?: string;
    nativeScreen?: boolean;
  };
};

export default function BackupSheet() {
  const { params: { step = WalletBackupStepTypes.backup_prompt } = {} } = useRoute<RouteProp<BackupSheetParams, 'BackupSheet'>>();

  const renderStep = useCallback(() => {
    switch (step) {
      case WalletBackupStepTypes.create_cloud_backup:
        return <BackupCloudStep />;
      case WalletBackupStepTypes.restore_from_backup:
        return <RestoreCloudStep />;
      case WalletBackupStepTypes.backup_prompt:
        return <BackupWalletPrompt />;
      case WalletBackupStepTypes.backup_prompt_manual:
        return <ManualBackupPrompt />;
      case WalletBackupStepTypes.backup_prompt_cloud:
        return <CloudBackupPrompt />;
      default:
        return <BackupWalletPrompt />;
    }
  }, [step]);

  useEffect(() => {
    return () => {
      if (
        [
          WalletBackupStepTypes.backup_prompt,
          WalletBackupStepTypes.backup_prompt_manual,
          WalletBackupStepTypes.backup_prompt_cloud,
        ].includes(step)
      ) {
        if (backupsStore.getState().timesPromptedForBackup === 0) {
          backupsStore.getState().setTimesPromptedForBackup(1);
        }
        backupsStore.getState().setLastBackupPromptAt(Date.now());
      }
    };
  }, [step]);

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          testID={'backup-sheet'}
          backgroundColor={backgroundColor as string}
          customHeight={getHeightForStep(step)}
          scrollEnabled={false}
        >
          {renderStep()}
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
