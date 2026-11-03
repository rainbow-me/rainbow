import React, { useCallback, useMemo, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';

import { upperFirst } from 'lodash';
import URL from 'url-parse';

import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { formatAddressForDisplay } from '@/features/address/core/formatAddress';
import { ENS_RECORDS } from '@/features/ens/core/records';
import { REGISTRATION_MODES } from '@/features/ens/types/registration';
import { setClipboard } from '@/hooks/useClipboard';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { openInBrowser } from '@/utils/openInBrowser';

import { useEnsRegistrationStore } from '../data/stores/registrationStore';
import { textRecordFields } from '../utils/helpers';

const icons = {
  [ENS_RECORDS.twitter]: 'x',
  [ENS_RECORDS.github]: 'github',
  [ENS_RECORDS.instagram]: 'instagram',
  [ENS_RECORDS.snapchat]: 'snapchat',
  [ENS_RECORDS.discord]: 'discord',
  [ENS_RECORDS.reddit]: 'reddit',
  [ENS_RECORDS.telegram]: 'telegram',
  [ENS_RECORDS.DOGE]: 'dogeCoin',
  [ENS_RECORDS.BTC]: 'btcCoin',
  [ENS_RECORDS.LTC]: 'ltcCoin',
} as { [key: string]: string };

const links = {
  [ENS_RECORDS.twitter]: 'https://x.com/',
  [ENS_RECORDS.github]: 'https://github.com/',
  [ENS_RECORDS.instagram]: 'https://instagram.com/',
  [ENS_RECORDS.reddit]: 'https://reddit.com/',
  [ENS_RECORDS.telegram]: 'https://t.me/',
} as { [key: string]: string };

export function useENSRecordDisplayProperties({
  allowEdit,
  ensName,
  imageUrl,
  key: recordKey,
  value: recordValue,
  type,
}: {
  allowEdit?: boolean;
  ensName?: string;
  imageUrl?: string | null;
  key: string;
  value: string;
  type: 'address' | 'record';
}) {
  const isImageValue = recordKey === ENS_RECORDS.avatar || recordKey === ENS_RECORDS.header;

  const isUrlRecord = useMemo(() => [ENS_RECORDS.url, ENS_RECORDS.website].includes(recordKey as ENS_RECORDS), [recordKey]);
  const isUrlValue = useMemo(() => recordValue.match(/^http/), [recordValue]);

  const url = useMemo(() => {
    if (isImageValue) {
      return imageUrl || undefined;
    }
    if (isUrlValue || isUrlRecord) {
      return recordValue.match(/^http/) ? recordValue : `https://${recordValue}`;
    }
    if (links[recordKey]) {
      return `${links[recordKey]}${recordValue.replace('@', '')}`;
    }
  }, [imageUrl, isImageValue, isUrlRecord, isUrlValue, recordKey, recordValue]);

  const { displayUrl, displayUrlUsername } = useMemo(() => {
    const urlObj = url ? new URL(url) : { hostname: '', pathname: '' };
    return {
      displayUrl: urlObj?.hostname?.replace(/^www\./, ''),
      displayUrlUsername: urlObj?.pathname?.replace('/', ''),
    };
  }, [url]);

  const label = useMemo(() => {
    if (textRecordFields[recordKey as keyof typeof textRecordFields]?.label) {
      return textRecordFields[recordKey as keyof typeof textRecordFields]!.label;
    }
    if (recordKey.includes('.')) {
      return recordKey;
    }
    return `${upperFirst(recordKey)}${type === 'address' ? ' address' : ''}`;
  }, [recordKey, type]);

  const value = useMemo(() => {
    if (isUrlRecord && displayUrl) {
      return Platform.OS === 'android' ? ` 􀤆 ${displayUrl} ` : `􀤆 ${displayUrl}`;
    }
    if (isUrlValue && displayUrlUsername) {
      return displayUrlUsername;
    }
    if (recordKey === ENS_RECORDS.email) {
      return `􀍕 ${recordValue}`;
    }
    if (type === 'address') {
      return formatAddressForDisplay(recordValue, 4, 4) || '';
    }
    if (
      recordValue.includes('@') &&
      (recordKey === ENS_RECORDS.discord ||
        recordKey === ENS_RECORDS.github ||
        recordKey === ENS_RECORDS.reddit ||
        recordKey === ENS_RECORDS.instagram ||
        recordKey === ENS_RECORDS.snapchat ||
        recordKey === ENS_RECORDS.telegram ||
        recordKey === ENS_RECORDS.twitter)
    ) {
      return recordValue.replace('@', '');
    }
    return recordValue;
  }, [displayUrl, displayUrlUsername, isUrlRecord, isUrlValue, recordKey, recordValue, type]);

  const icon = useMemo(() => icons[recordKey], [recordKey]);

  const menuItems = useMemo(() => {
    return [
      allowEdit && type === 'record' && Object.values(ENS_RECORDS).includes(recordKey as ENS_RECORDS)
        ? {
            actionKey: 'edit',
            actionTitle: i18n.t(i18n.l.expanded_state.unique_expanded.edit),
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'square.and.pencil',
            },
          }
        : undefined,
      url
        ? {
            actionKey: 'open-url',
            actionTitle: i18n.t(i18n.l.expanded_state.unique_expanded.view_on_platform, { platform: isUrlValue ? 'Web' : label }),
            discoverabilityTitle: displayUrl,
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'arrow.up.forward.app.fill',
            },
          }
        : undefined,
      {
        actionKey: 'copy',
        actionTitle: i18n.t(i18n.l.expanded_state.unique_expanded.copy),
        discoverabilityTitle: displayUrl || recordValue,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.on.square',
        },
      },
    ].filter(Boolean);
  }, [allowEdit, displayUrl, isUrlValue, label, recordKey, recordValue, type, url]);

  const { navigate } = useNavigation();

  const handlePressMenuItem = useCallback(
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'open-url' && url) {
        openInBrowser(url);
      }
      if (actionKey === 'copy') {
        setClipboard(recordValue);
      }
      if (actionKey === 'edit' && ensName) {
        useEnsRegistrationStore.getState().start(useWalletsStore.getState().accountAddress, ensName, REGISTRATION_MODES.EDIT);
        navigate(Routes.REGISTER_ENS_NAVIGATOR, {
          autoFocusKey: recordKey,
          ensName,
          mode: REGISTRATION_MODES.EDIT,
        });
      }
    },
    [ensName, navigate, recordKey, recordValue, url]
  );

  const Button = useCallback(
    ({ children, ...props }: PropsWithChildren<any>) => (
      <ContextMenuButton
        enableContextMenu
        menuConfig={{ menuItems, menuTitle: '' }}
        {...(Platform.OS === 'android' ? { handlePressMenuItem } : {})}
        onPressMenuItem={handlePressMenuItem}
        style={{ flexGrow: isImageValue ? 1 : 0, flexShrink: 1 }}
        {...props}
      >
        {children}
      </ContextMenuButton>
    ),
    [handlePressMenuItem, isImageValue, menuItems]
  );

  return {
    ContextMenuButton: Button,
    icon,
    isImageValue,
    label,
    url,
    value,
  };
}
