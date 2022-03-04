import { partition, upperFirst } from 'lodash';
import React, { useMemo } from 'react';
import URL from 'url-parse';
import InfoRow from './InfoRow';
import { Stack } from '@rainbow-me/design-system';
import { Records } from '@rainbow-me/entities';
import { ENS_RECORDS, textRecordFields } from '@rainbow-me/helpers/ens';
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
  [ENS_RECORDS.twitter]: 'twitter',
  [ENS_RECORDS.github]: 'github',
  [ENS_RECORDS.instagram]: 'instagram',
  [ENS_RECORDS.snapchat]: 'snapchat',
  [ENS_RECORDS.discord]: 'discord',
} as { [key: string]: string };

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
  }, [isUrlValue, recordValue]);

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
    <InfoRow
      icon={icons[recordKey]}
      isImage={isImageValue}
      label={label}
      value={isImageValue ? url : value}
    />
  );
}
