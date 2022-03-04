import { partition, upperFirst } from 'lodash';
import React, { useMemo, useState } from 'react';
import URL from 'url-parse';
import DiscordIcon from '../../icons/svg/DiscordIcon';
import GitHubIcon from '../../icons/svg/GitHubIcon';
import InstagramIcon from '../../icons/svg/InstagramIcon';
import SnapchatIcon from '../../icons/svg/SnapchatIcon';
import TwitterIcon from '../../icons/svg/TwitterIcon';
import { useTheme } from '@rainbow-me/context';
import {
  Bleed,
  Box,
  Inline,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { Records } from '@rainbow-me/entities';
import { ENS_RECORDS, textRecordFields } from '@rainbow-me/helpers/ens';
import { ImgixImage } from '@rainbow-me/images';
import { formatAddressForDisplay } from '@rainbow-me/utils/abbreviations';

const omitRecordKeys = [ENS_RECORDS.avatar];
const topRecordKeys = [ENS_RECORDS.cover, 'cover', ENS_RECORDS.description];

const imageKeyMap = {
  [ENS_RECORDS.avatar]: 'avatarUrl',
  [ENS_RECORDS.cover]: 'coverUrl',
  cover: 'coverUrl',
} as {
  [key: string]: 'avatarUrl' | 'coverUrl';
};

const icons = {
  [ENS_RECORDS.twitter]: TwitterIcon,
  [ENS_RECORDS.github]: GitHubIcon,
  [ENS_RECORDS.instagram]: InstagramIcon,
  [ENS_RECORDS.snapchat]: SnapchatIcon,
  [ENS_RECORDS.discord]: DiscordIcon,
};

export default function ProfileInfoSection({
  coinAddresses: coinAddressMap,
  images,
  records,
}: {
  coinAddresses: { [key: string]: string };
  images: {
    avatarUrl?: string | null;
    coverUrl?: string | null;
  };
  records: Partial<Records>;
}) {
  const recordsArray = useMemo(
    () =>
      Object.entries(records)
        .filter(([key]) => !omitRecordKeys.includes(key as ENS_RECORDS))
        .map(([key, value]) =>
          images[imageKeyMap[key]]
            ? [key, images[imageKeyMap[key]] as string]
            : [key, value]
        ),
    [images, records]
  );

  const [topRecords, otherRecords] = useMemo(() => {
    const [topRecords, otherRecords] = partition(recordsArray, ([key]) =>
      topRecordKeys.includes(key)
    );
    const orderedTopRecords = topRecordKeys
      .map(key => topRecords.find(([k]) => k === key))
      .filter(Boolean) as [ENS_RECORDS, string][];
    return [orderedTopRecords, otherRecords];
  }, [recordsArray]);
  const coinAddresses = useMemo(() => Object.entries(coinAddressMap), [
    coinAddressMap,
  ]);

  return (
    <Stack space="15px">
      {topRecords.map(([recordKey, recordValue]) =>
        recordValue ? (
          <ProfileInfoRow
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
            key={recordKey}
            recordKey={recordKey}
            recordValue={recordValue}
            type="record"
          />
        ) : null
      )}
    </Stack>
  );
}

function ProfileInfoRow({
  recordKey,
  recordValue,
  type,
}: {
  recordKey: string;
  recordValue: string;
  type: 'address' | 'record';
}) {
  const { colors } = useTheme();

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

  const [show, setShow] = useState(isImageValue);
  const [isMultiline, setIsMultiline] = useState(false);

  const url = useMemo(() => {
    if (isUrlValue) {
      return recordValue.match(/^http/)
        ? recordValue
        : `https://${recordValue}`;
    }
  }, [isUrlValue, recordValue]);

  const Icon = useMemo(() => {
    // @ts-expect-error
    return icons[recordKey];
  }, [recordKey]);

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
    if (isUrlValue && url) {
      const displayUrl = new URL(url).hostname.replace(/^www\./, '');
      return `􀤆 ${displayUrl}`;
    }
    if (recordKey === ENS_RECORDS.email) {
      return `􀍕 ${recordValue}`;
    }
    if (type === 'address') {
      return formatAddressForDisplay(recordValue, 4, 4) || '';
    }
    return recordValue;
  }, [isUrlValue, recordKey, recordValue, type, url]);

  return (
    <Inline alignHorizontal="justify" horizontalSpace="24px" wrap={false}>
      <Box style={{ minWidth: 60, opacity: show ? 1 : 0 }}>
        <Inset top={isMultiline ? '15px' : '10px'}>
          <Text color="secondary60" size="16px" weight="bold">
            {label}
          </Text>
        </Inset>
      </Box>
      {isImageValue ? (
        <Box
          as={ImgixImage}
          borderRadius={16}
          flexShrink={1}
          height="64px"
          source={{ uri: recordValue }}
          width="full"
        />
      ) : (
        <Box
          borderRadius={16}
          flexShrink={1}
          onLayout={({
            nativeEvent: {
              layout: { height },
            },
          }) => {
            setIsMultiline(height > 40);
            setShow(true);
          }}
          padding={isMultiline ? '15px' : '10px'}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            opacity: show ? 1 : 0,
          }}
        >
          <Inline alignVertical="center" space="6px">
            {Icon && (
              <Bleed vertical="2px">
                <Icon color={colors.white} height="18" width="18" />
              </Bleed>
            )}
            <Text containsEmoji weight="semibold">
              {value}
            </Text>
          </Inline>
        </Box>
      )}
    </Inline>
  );
}
