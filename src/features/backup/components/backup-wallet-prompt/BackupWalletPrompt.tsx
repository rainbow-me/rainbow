import React from 'react';

import { Bleed, Inset, Separator, Text } from '@/design-system';
import * as i18n from '@/languages';

import { CloudBackupOptionRow } from './CloudBackupOptionRow';
import { ManualBackupOptionRow } from './ManualBackupOptionRow';

export function BackupWalletPrompt() {
  return (
    <Inset horizontal={'24px'} vertical={'44px'} testId={'backup-reminder-sheet'}>
      <Inset bottom={'44px'} horizontal={'24px'}>
        <Text align="center" size="26pt" weight="bold" color="label">
          {i18n.t(i18n.l.back_up.cloud.how_would_you_like_to_backup)}
        </Text>
      </Inset>

      <Bleed horizontal="24px">
        <Separator color="separatorSecondary" thickness={1} />
      </Bleed>

      <CloudBackupOptionRow />

      <Bleed horizontal="24px">
        <Separator color="separatorSecondary" thickness={1} />
      </Bleed>

      <ManualBackupOptionRow />
    </Inset>
  );
}
