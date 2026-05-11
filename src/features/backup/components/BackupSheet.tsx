import React, { useCallback, useEffect } from 'react';

import { useRoute, type RouteProp } from '@react-navigation/native';

import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { BackgroundProvider } from '@/design-system';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import { getHeightForStep } from '@/navigation/config';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';

import { backupsStore } from '../stores/backupsStore';
import BackupCloudStep from './BackupCloudStep';
import BackupWalletPrompt from './BackupWalletPrompt';
import CloudBackupPrompt from './CloudBackupPrompt';
import ManualBackupPrompt from './ManualBackupPrompt';
import RestoreCloudStep from './RestoreCloudStep';

export default function BackupSheet() {
  const { params: { step = WalletBackupStepTypes.backup_prompt } = {} } =
    useRoute<RouteProp<RootStackParamList, typeof Routes.BACKUP_SHEET>>();

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
