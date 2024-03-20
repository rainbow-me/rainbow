import { useCreateBackupStateType } from '@/components/backup/useCreateBackup';
import { useTheme } from '@/theme';
import React, { useState, useMemo, useEffect } from 'react';
import * as i18n from '@/languages';
import MenuItem from '../MenuItem';
import Spinner from '@/components/Spinner';
import { FloatingEmojis } from '@/components/floating-emojis';
import { useDimensions } from '@/hooks';

export const BackUpMenuItem = ({
  icon = '􀊯',
  loading,
  onPress,
  title,
}: {
  icon?: string;
  loading: useCreateBackupStateType;
  title: string;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  const { width: deviceWidth } = useDimensions();
  const [emojiTrigger, setEmojiTrigger] = useState<null | (() => void)>(null);

  useEffect(() => {
    if (loading === 'success') {
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          emojiTrigger?.();
        }, 100 * i);
      }
    }
  }, [emojiTrigger, loading]);

  const accentColor = useMemo(() => {
    switch (loading) {
      case 'success':
        return colors.green;
      case 'error':
        return colors.red;
      default:
        return undefined;
    }
  }, [colors, loading]);

  const titleText = useMemo(() => {
    switch (loading) {
      case 'loading':
        return i18n.t(i18n.l.back_up.cloud.backing_up);
      case 'success':
        return i18n.t(i18n.l.back_up.cloud.backup_success);
      case 'error':
        return i18n.t(i18n.l.back_up.cloud.backup_failed);
      default:
        return title;
    }
  }, [loading, title]);
  const localIcon = useMemo(() => {
    switch (loading) {
      case 'success':
        return '􀁢';
      case 'error':
        return '􀀲';
      default:
        return icon;
    }
  }, [icon, loading]);

  return (
    <>
      {/* @ts-ignore js */}
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
        {({ onNewEmoji }: { onNewEmoji: () => void }) => (
          <MenuItem
            hasSfSymbol
            leftComponent={
              loading === 'loading' ? (
                <Spinner size={20} color={colors.appleBlue} />
              ) : (
                <MenuItem.TextIcon icon={localIcon} isLink colorOverride={accentColor} />
              )
            }
            onPress={() => {
              setEmojiTrigger(() => onNewEmoji);
              onPress();
            }}
            size={52}
            titleComponent={<MenuItem.Title isLink customColor={accentColor} text={titleText} />}
          />
        )}
      </FloatingEmojis>
    </>
  );
};
