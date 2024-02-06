import ConditionalWrap from 'conditional-wrap';
import lang from 'i18n-js';
import React, { useCallback, useMemo, useState } from 'react';
import { ContextMenuButton, MenuConfig } from 'react-native-ios-context-menu';
import ActionButton from './ActionButton';
import { useWatchWallet } from '@/hooks';

export default function WatchButton({ address, ensName, avatarUrl }: { address?: string; ensName?: string; avatarUrl?: string | null }) {
  const { isImporting, isWatching, watchWallet } = useWatchWallet({
    address,
    avatarUrl,
    ensName,
    showImportModal: false,
  });

  // An "optimistic" state will provide us with optimistic feedback on the UI,
  // and not wait for the import to finish.
  const [optimisticIsWatching, setOptimisticIsWatching] = useState(isWatching);

  const handlePressWatch = useCallback(() => {
    if (!isImporting) {
      watchWallet();
      setOptimisticIsWatching(isWatching => !isWatching);
    }
  }, [isImporting, watchWallet]);

  const menuConfig = useMemo(() => {
    return {
      menuItems: [
        {
          actionKey: 'unwatch',
          actionTitle: lang.t('profiles.actions.unwatch_ens', { ensName }),
          menuAttributes: ['destructive'],
        },
      ],
      menuTitle: lang.t('profiles.actions.unwatch_ens_title', { ensName }),
    } as MenuConfig;
  }, [ensName]);

  return (
    <ConditionalWrap
      condition={optimisticIsWatching}
      wrap={children => (
        <ContextMenuButton
          enableContextMenu
          menuConfig={menuConfig}
          {...(android ? { onPress: handlePressWatch } : {})}
          isMenuPrimaryAction
          onPressMenuItem={handlePressWatch}
          useActionSheetFallback={false}
        >
          {children}
        </ContextMenuButton>
      )}
    >
      <ActionButton
        color="action (Deprecated)"
        onPress={!optimisticIsWatching ? handlePressWatch : () => null}
        paddingHorizontal={isWatching ? { custom: 11.25 } : undefined}
        testID="profile-sheet-watch-button"
        variant={!optimisticIsWatching ? 'solid' : 'outlined'}
      >
        {(optimisticIsWatching ? '' : '􀨭 ') + lang.t(`profiles.actions.${optimisticIsWatching ? 'watching' : 'watch'}`)}
      </ActionButton>
    </ConditionalWrap>
  );
}
