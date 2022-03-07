import { partition, upperFirst } from 'lodash';
import React, { useCallback, useMemo } from 'react';
import { Linking } from 'react-native';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import URL from 'url-parse';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import InfoRow, { InfoRowSkeleton } from './InfoRow';
import { Stack } from '@rainbow-me/design-system';
import { Records } from '@rainbow-me/entities';
import { ENS_RECORDS, textRecordFields } from '@rainbow-me/helpers/ens';
import { useClipboard } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { showActionSheetWithOptions } from '@rainbow-me/utils';
import { formatAddressForDisplay } from '@rainbow-me/utils/abbreviations';

const omitRecordKeys = [ENS_RECORDS.avatar];
const topRecordKeys = [ENS_RECORDS.cover, ENS_RECORDS.description];

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

export default function ProfileInfoSection({
  allowEdit,
  coinAddresses: coinAddressMap,
  ensName,
  images,
  isLoading,
  records,
}: {
  allowEdit?: boolean;
  coinAddresses?: { [key: string]: string };
  ensName?: string;
  images?: {
    avatarUrl?: string | null;
    coverUrl?: string | null;
  };
  isLoading?: boolean;
  records?: Partial<Records>;
}) {
  const recordsArray = useMemo(
    () =>
      Object.entries(records || {})
        .filter(([key]) => !omitRecordKeys.includes(key as ENS_RECORDS))
        .map(([key, value]) =>
          images?.[imageKeyMap[key]]
            ? [key, images[imageKeyMap[key]] as string]
            : [key, value]
        ),
    [images, records]
  );

  const [topRecords, otherRecords] = useMemo(() => {
    const [topRecords, otherRecords] = partition(
      recordsArray,
      ([key]: [ENS_RECORDS]) => topRecordKeys.includes(key)
    );
    const orderedTopRecords = topRecordKeys
      .map(key => topRecords.find(([k]: any) => k === key))
      .filter(Boolean) as [ENS_RECORDS, string][];
    return [orderedTopRecords, otherRecords];
  }, [recordsArray]);
  const coinAddresses = useMemo(() => Object.entries(coinAddressMap || {}), [
    coinAddressMap,
  ]);

  return (
    <Stack space="15px">
      {isLoading ? (
        <>
          <InfoRowSkeleton />
          <InfoRowSkeleton />
          <InfoRowSkeleton />
          <InfoRowSkeleton />
        </>
      ) : (
        <>
          {topRecords.map(([recordKey, recordValue]) =>
            recordValue ? (
              <ProfileInfoRow
                allowEdit={allowEdit}
                ensName={ensName}
                key={recordKey}
                recordKey={recordKey}
                recordValue={recordValue}
                type="record"
              />
            ) : null
          )}
          {coinAddresses.map(([recordKey, recordValue]) =>
            recordValue ? (
              <ProfileInfoRow
                allowEdit={allowEdit}
                ensName={ensName}
                key={recordKey}
                recordKey={recordKey}
                recordValue={recordValue}
                type="address"
              />
            ) : null
          )}
          {otherRecords.map(([recordKey, recordValue]) =>
            recordValue ? (
              <ProfileInfoRow
                allowEdit={allowEdit}
                ensName={ensName}
                key={recordKey}
                recordKey={recordKey}
                recordValue={recordValue}
                type="record"
              />
            ) : null
          )}
        </>
      )}
    </Stack>
  );
}

function ProfileInfoRow({
  allowEdit,
  ensName,
  recordKey,
  recordValue,
  type,
}: {
  allowEdit?: boolean;
  ensName?: string;
  recordKey: string;
  recordValue: string;
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

  const menuItems = useMemo(() => {
    return [
      allowEdit &&
      type === 'record' &&
      Object.values(ENS_RECORDS).includes(recordKey as ENS_RECORDS)
        ? {
            actionKey: 'edit',
            actionTitle: 'Edit',
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'square.and.pencil',
            },
          }
        : undefined,
      {
        actionKey: 'copy',
        actionTitle: 'Copy',
        discoverabilityTitle: displayUrl || recordValue,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'doc.on.doc',
        },
      },
      url
        ? {
            actionKey: 'open-url',
            actionTitle: 'View on Web',
            discoverabilityTitle: displayUrl,
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'safari.fill',
            },
          }
        : undefined,
    ].filter(x => x);
  }, [allowEdit, displayUrl, recordKey, recordValue, type, url]);

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

  return (
    <InfoRow
      icon={icons[recordKey]}
      isImage={isImageValue}
      label={label}
      value={isImageValue ? url : value}
      wrapValue={children => (
        <ContextMenuButton
          enableContextMenu
          // @ts-expect-error
          menuConfig={{ menuItems, menuTitle: '' }}
          {...(android ? { onPress: handleAndroidPress } : {})}
          isMenuPrimaryAction
          onPressMenuItem={handlePressMenuItem}
          style={{ flexGrow: isImageValue ? 1 : 0, flexShrink: 1 }}
          useActionSheetFallback={false}
        >
          <ButtonPressAnimation scaleTo={0.9}>{children}</ButtonPressAnimation>
        </ContextMenuButton>
      )}
    />
  );
}
