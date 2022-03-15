import lang from 'i18n-js';
import { upperFirst } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { Linking } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import URL from 'url-parse';
import useClipboard from './useClipboard';
import { ENS_RECORDS, textRecordFields } from '@rainbow-me/helpers/ens';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { showActionSheetWithOptions } from '@rainbow-me/utils';
import { formatAddressForDisplay } from '@rainbow-me/utils/abbreviations';

const imageKeyMap = {
  [ENS_RECORDS.avatar]: 'avatarUrl',
  [ENS_RECORDS.cover]: 'coverUrl',
} as {
  [key: string]: 'avatarUrl' | 'coverUrl';
};

const icons = {
  [ENS_RECORDS.twitter]: 'twitter',
  [ENS_RECORDS.github]: 'github',
  [ENS_RECORDS.instagram]: 'instagram',
  [ENS_RECORDS.snapchat]: 'snapchat',
  [ENS_RECORDS.discord]: 'discord',
} as { [key: string]: string };

const links = {
  [ENS_RECORDS.twitter]: 'https://twitter.com/',
  [ENS_RECORDS.github]: 'https://github.com/',
  [ENS_RECORDS.instagram]: 'https://intagram.com/',
  [ENS_RECORDS.reddit]: 'https://reddit.com/',
  [ENS_RECORDS.telegram]: 'https://telegram.com/',
} as { [key: string]: string };

export default function useENSRecordDisplayProperties({
  allowEdit,
  ensName,
  key: recordKey,
  value: recordValue,
  type,
}: {
  allowEdit?: boolean;
  ensName?: string;
  key: string;
  value: string;
  type: 'address' | 'record';
}) {
  const isImageValue = useMemo(
    () => Object.keys(imageKeyMap).includes(recordKey),
    [recordKey]
  );
  const isUrlValue = useMemo(
    () =>
      recordValue.match(/^http/) ||
      [ENS_RECORDS.url, ENS_RECORDS.website].includes(recordKey as ENS_RECORDS),
    [recordKey, recordValue]
  );

  const url = useMemo(() => {
    if (isUrlValue) {
      return recordValue.match(/^http/)
        ? recordValue
        : `https://${recordValue}`;
    }
    if (links[recordKey]) {
      return `${links[recordKey]}${recordValue.replace('@', '')}`;
    }
  }, [isUrlValue, recordKey, recordValue]);

  const displayUrl = useMemo(
    () => (url ? new URL(url).hostname.replace(/^www\./, '') : undefined),
    [url]
  );

  const label = useMemo(() => {
    // @ts-expect-error
    if (textRecordFields[recordKey]?.label) {
      // @ts-expect-error
      return textRecordFields[recordKey].label;
    }
    if (recordKey.includes('.')) {
      return recordKey;
    }
    return `${upperFirst(recordKey)}${type === 'address' ? ' address' : ''}`;
  }, [recordKey, type]);

  const value = useMemo(() => {
    if (isUrlValue && displayUrl) {
      return `􀤆 ${displayUrl}`;
    }
    if (recordKey === ENS_RECORDS.email) {
      return `􀍕 ${recordValue}`;
    }
    if (type === 'address') {
      return formatAddressForDisplay(recordValue, 4, 4) || '';
    }
    return recordValue;
  }, [displayUrl, isUrlValue, recordKey, recordValue, type]);

  const icon = useMemo(() => icons[recordKey], [recordKey]);

  const menuItems = useMemo(() => {
    return [
      allowEdit &&
      type === 'record' &&
      Object.values(ENS_RECORDS).includes(recordKey as ENS_RECORDS)
        ? {
            actionKey: 'edit',
            actionTitle: lang.t('expanded_state.unique_expanded.edit'),
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'square.and.pencil',
            },
          }
        : undefined,
      url
        ? {
            actionKey: 'open-url',
            actionTitle: lang.t(
              'expanded_state.unique_expanded.view_on_platform',
              { platform: isUrlValue ? 'Web' : label }
            ),
            discoverabilityTitle: displayUrl,
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'safari.fill',
            },
          }
        : undefined,
      {
        actionKey: 'copy',
        actionTitle: lang.t('expanded_state.unique_expanded.copy'),
        discoverabilityTitle: displayUrl || recordValue,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'doc.on.doc',
        },
      },
    ].filter(x => x);
  }, [
    allowEdit,
    displayUrl,
    isUrlValue,
    label,
    recordKey,
    recordValue,
    type,
    url,
  ]);

  const { navigate } = useNavigation();
  const { setClipboard } = useClipboard();
  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'open-url' && url) {
        Linking.openURL(url);
      }
      if (actionKey === 'copy') {
        setClipboard(recordValue);
      }
      if (actionKey === 'edit') {
        navigate(Routes.REGISTER_ENS_NAVIGATOR, {
          autoFocusKey: recordKey,
          ensName,
          mode: 'edit',
        });
      }
    },
    [ensName, navigate, recordKey, recordValue, setClipboard, url]
  );

  const handleAndroidPress = useCallback(() => {
    const actionSheetOptions = menuItems
      .map(item => item?.actionTitle)
      .filter(x => x) as any;

    showActionSheetWithOptions(
      {
        options: actionSheetOptions,
      },
      async (buttonIndex: number) => {
        const actionKey = menuItems[buttonIndex]?.actionKey;
        handlePressMenuItem({ nativeEvent: { actionKey } });
      }
    );
  }, [handlePressMenuItem, menuItems]);

  const Button = useCallback(
    ({ children, ...props }) => (
      <ContextMenuButton
        enableContextMenu
        menuConfig={{ menuItems, menuTitle: '' }}
        {...(android ? { onPress: handleAndroidPress } : {})}
        isMenuPrimaryAction
        onPressMenuItem={handlePressMenuItem}
        style={{ flexGrow: isImageValue ? 1 : 0, flexShrink: 1 }}
        useActionSheetFallback={false}
        {...props}
      >
        {children}
      </ContextMenuButton>
    ),
    [handleAndroidPress, handlePressMenuItem, isImageValue, menuItems]
  );

  return {
    ContextMenuButton: Button,
    icon,
    isImageValue,
    isUrlValue,
    label,
    url,
    value,
  };
}
