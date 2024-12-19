import { useTheme } from '@/theme';
import React, { useState, useMemo, useEffect } from 'react';
import * as i18n from '@/languages';
import MenuItem from '../MenuItem';
import Spinner from '@/components/Spinner';
import { FloatingEmojis } from '@/components/floating-emojis';
import { useDimensions } from '@/hooks';
import { CloudBackupState } from '@/state/backups/backups';

export const BackUpMenuItem = ({
  icon = '􀊯',
  backupState,
  onPress,
  title,
  disabled,
}: {
  icon?: string;
  backupState: CloudBackupState;
  title: string;
  onPress: () => void;
  disabled?: boolean;
}) => {
  const { colors } = useTheme();
  const { width: deviceWidth } = useDimensions();
  const [emojiTrigger, setEmojiTrigger] = useState<null | (() => void)>(null);

  useEffect(() => {
    if (backupState === CloudBackupState.Success) {
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          emojiTrigger?.();
        }, 100 * i);
      }
    }
  }, [emojiTrigger, backupState]);

  const accentColor = useMemo(() => {
    switch (backupState) {
      case CloudBackupState.Success:
        return colors.green;
      case CloudBackupState.Error:
        return colors.red;
      default:
        return undefined;
    }
  }, [colors, backupState]);

  const titleText = useMemo(() => {
    switch (backupState) {
      case CloudBackupState.InProgress:
        return i18n.t(i18n.l.back_up.cloud.backing_up);
      case CloudBackupState.Success:
        return i18n.t(i18n.l.back_up.cloud.backup_success);
      case CloudBackupState.Error:
        return i18n.t(i18n.l.back_up.cloud.backup_failed);
      default:
        return title;
    }
  }, [backupState, title]);
  const localIcon = useMemo(() => {
    switch (backupState) {
      case CloudBackupState.Success:
        return '􀁢';
      case CloudBackupState.Error:
        return '􀀲';
      default:
        return icon;
    }
  }, [icon, backupState]);

  return (
    <FloatingEmojis
      centerVertically
      distance={600}
      duration={1000}
      emojis={['check_mark_button']}
      marginTop={-10}
      fadeOut={false}
      range={[deviceWidth / 2 - 100, deviceWidth / 2 + 100]}
      gravityEnabled
      scaleTo={0}
      size={100}
      wiggleFactor={0}
    >
      {({ onNewEmoji }) => (
        <MenuItem
          testID={'backup-now-button'}
          hasSfSymbol
          disabled={disabled}
          leftComponent={
            backupState === CloudBackupState.InProgress ? (
              <Spinner size={20} color={colors.appleBlue} />
            ) : (
              <MenuItem.TextIcon disabled={disabled} icon={localIcon} isLink colorOverride={disabled ? undefined : accentColor} />
            )
          }
          onPress={() => {
            setEmojiTrigger(() => onNewEmoji);
            onPress();
          }}
          size={52}
          titleComponent={<MenuItem.Title disabled={disabled} isLink customColor={disabled ? undefined : accentColor} text={titleText} />}
        />
      )}
    </FloatingEmojis>
  );
};
