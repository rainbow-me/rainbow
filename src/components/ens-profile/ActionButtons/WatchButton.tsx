import ConditionalWrap from 'conditional-wrap';
import lang, { l } from 'i18n-js';
import debounce from 'lodash/debounce';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ContextMenuButton, MenuConfig } from 'react-native-ios-context-menu';
import ActionButton from './ActionButton';
import { useWatchWallet } from '@rainbow-me/hooks';

export default function WatchButton({
  address,
  ensName,
  avatarUrl,
}: {
  address?: string;
  ensName?: string;
  avatarUrl?: string | null;
}) {
  const { isWatching, watchWallet } = useWatchWallet({
    address,
    avatarUrl,
    ensName,
    showImportModal: false,
  });

  // An "optimistic" state will provide us with optimistic feedback on the UI,
  // and not wait for the import to finish.
  const [optimisticIsWatching, setOptimisticIsWatching] = useState(isWatching);

  // We need a ref here to avoid recreating the debounce function.
  const optimisticIsWatchingRef = useRef<boolean>();
  optimisticIsWatchingRef.current = optimisticIsWatching;

  const handleWatch = useCallback(() => {
    if (isWatching !== optimisticIsWatchingRef.current) {
      watchWallet();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // We want to debounce the watch/unwatch functionality to avoid spamming the
  // JS thread.
  const debouncedWatchWallet = debounce(handleWatch, 500);

  const handlePressWatch = useCallback(() => {
    debouncedWatchWallet();
    setOptimisticIsWatching(isWatching => !isWatching);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        color="action"
        onPress={!optimisticIsWatching ? handlePressWatch : () => null}
        paddingHorizontal={isWatching ? { custom: 11.25 } : undefined}
        testID="profile-sheet-watch-button"
        variant={!optimisticIsWatching ? 'solid' : 'outlined'}
      >
        {(optimisticIsWatching ? '' : '􀨭 ') + lang.t(
          `profiles.actions.${optimisticIsWatching ? 'watching' : 'watch'}`
        )}
      </ActionButton>
    </ConditionalWrap>
  );
}
