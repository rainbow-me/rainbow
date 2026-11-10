import React, { useMemo } from 'react';

import { partition } from 'lodash';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Stack } from '@/design-system';
import { deprecatedTextRecordFields, ENS_RECORDS } from '@/features/ens/core/records';

import { useEnsImageStore } from '../../data/stores/imageStore';
import { useENSRecordDisplayProperties } from '../../hooks/useENSRecordDisplayProperties';
import type { Records } from '../../types/registration';
import { InfoRow, InfoRowSkeleton } from './InfoRow';

const omitRecordKeys = [ENS_RECORDS.avatar, ENS_RECORDS.displayName];
const topRecordKeys = [ENS_RECORDS.header, ENS_RECORDS.name, ENS_RECORDS.description];

export function ProfileInfoSection({
  allowEdit,
  coinAddresses: coinAddressMap,
  ensName,
  isLoading,
  records,
}: {
  allowEdit?: boolean;
  coinAddresses?: Records;
  ensName?: string;
  isLoading?: boolean;
  records?: Records;
}) {
  const headerImage = useEnsImageStore(s => s.get(ensName && records?.header ? { name: ensName, field: 'header' } : undefined));
  const recordsArray = useMemo(
    () =>
      Object.entries(records || {})
        .map(([key, value]) => {
          if (deprecatedTextRecordFields[key as ENS_RECORDS]) return [deprecatedTextRecordFields[key as ENS_RECORDS], value];
          return [key, value];
        })
        .filter(([key]) => !omitRecordKeys.includes(key as ENS_RECORDS)),
    [records]
  );

  const [topRecords, otherRecords] = useMemo(() => {
    const [topRecords, otherRecords] = partition(recordsArray, ([key]: [ENS_RECORDS]) => topRecordKeys.includes(key));
    const orderedTopRecords = topRecordKeys.map(key => topRecords.find(([k]: any) => k === key)).filter(Boolean) as [ENS_RECORDS, string][];
    return [orderedTopRecords, otherRecords as [ENS_RECORDS, string][]];
  }, [recordsArray]);
  const coinAddresses = useMemo(() => Object.entries(coinAddressMap || {}), [coinAddressMap]);

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
                imageUrl={recordKey === ENS_RECORDS.header ? headerImage : undefined}
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
  imageUrl,
  recordKey,
  recordValue,
  type,
}: {
  allowEdit?: boolean;
  ensName?: string;
  imageUrl?: string | null;
  recordKey: string;
  recordValue: string;
  type: 'address' | 'record';
}) {
  const { ContextMenuButton, icon, isImageValue, label, url, value } = useENSRecordDisplayProperties({
    allowEdit,
    ensName,
    imageUrl,
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
            <ButtonPressAnimation scaleTo={0.9}>{children}</ButtonPressAnimation>
          </ContextMenuButton>
        ) : (
          children
        )
      }
    />
  );
}
