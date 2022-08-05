import { partition } from 'lodash';
import React, { useMemo } from 'react';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import InfoRow, { InfoRowSkeleton } from './InfoRow';
import { Stack } from '@rainbow-me/design-system';
import { Records } from '@rainbow-me/entities';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';
import { useENSRecordDisplayProperties } from '@rainbow-me/hooks';

const omitRecordKeys = [ENS_RECORDS.avatar];
const topRecordKeys = [ENS_RECORDS.cover, ENS_RECORDS.description];

type ImageSource = { imageUrl?: string | null };
type ENSImages = {
  avatar?: ImageSource;
  cover?: ImageSource;
};

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
  images?: ENSImages;
  isLoading?: boolean;
  records?: Partial<Records>;
}) {
  const recordsArray = useMemo(
    () =>
      Object.entries(records || {}).filter(
        ([key]) => !omitRecordKeys.includes(key as ENS_RECORDS)
      ),
    [records]
  );

  const [topRecords, otherRecords] = useMemo(() => {
    const [topRecords, otherRecords] = partition(
      recordsArray,
      ([key]: [ENS_RECORDS]) => topRecordKeys.includes(key)
    );
    const orderedTopRecords = topRecordKeys
      .map(key => topRecords.find(([k]: any) => k === key))
      .filter(Boolean) as [ENS_RECORDS, string][];
    return [orderedTopRecords, otherRecords as [ENS_RECORDS, string][]];
  }, [recordsArray]);
  const coinAddresses = useMemo(() => Object.entries(coinAddressMap || {}), [
    coinAddressMap,
  ]);

  return (
    <Stack space={{ custom: 16 }}>
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
                images={images}
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
  images,
  recordKey,
  recordValue,
  type,
}: {
  allowEdit?: boolean;
  ensName?: string;
  images?: ENSImages;
  recordKey: string;
  recordValue: string;
  type: 'address' | 'record';
}) {
  const {
    ContextMenuButton,
    icon,
    isImageValue,
    label,
    url,
    value,
  } = useENSRecordDisplayProperties({
    allowEdit,
    ensName,
    images,
    key: recordKey,
    type,
    value: recordValue,
  });

  return (
    <InfoRow
      ensName={ensName}
      icon={icon}
      isImage={isImageValue}
      label={label}
      url={url}
      value={value}
      wrapValue={children =>
        !isImageValue ? (
          <ContextMenuButton>
            <ButtonPressAnimation scaleTo={0.9}>
              {children}
            </ButtonPressAnimation>
          </ContextMenuButton>
        ) : (
          children
        )
      }
    />
  );
}
