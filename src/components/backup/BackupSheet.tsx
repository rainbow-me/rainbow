import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useCallback } from 'react';
import { BackupCloudStep, RestoreCloudStep } from '.';
import WalletBackupStepTypes from '@/helpers/walletBackupStepTypes';
import BackupWalletPrompt from '@/components/backup/BackupWalletPrompt';
import { BackgroundProvider } from '@/design-system';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import { getHeightForStep } from '@/navigation/config';

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
      case WalletBackupStepTypes.backup_cloud:
        return <BackupCloudStep />;
      case WalletBackupStepTypes.restore_from_backup:
        return <RestoreCloudStep />;
      case WalletBackupStepTypes.backup_prompt:
      default:
        return <BackupWalletPrompt />;
    }
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
