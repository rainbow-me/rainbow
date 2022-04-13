import lang from 'i18n-js';
import React from 'react';
import InfoRow, { InfoRowSkeleton } from './InfoRow';
import { Stack } from '@rainbow-me/design-system';
import { formatAddressForDisplay } from '@rainbow-me/utils/abbreviations';

export default function ConfigurationSection({
  isLoading,
  owner,
  registrant,
  isPrimary,
  isOwner,
}: {
  isLoading?: boolean;
  owner?: { name?: string; address?: string };
  registrant?: { name?: string; address?: string };
  isPrimary?: boolean;
  isOwner?: boolean;
}) {
  console.log('isPrimary', isPrimary, isOwner);
  return (
    <Stack space="15px">
      {isLoading ? (
        <>
          <InfoRowSkeleton />
          <InfoRowSkeleton />
        </>
      ) : (
        <>
          {/* <Box height="1/5">
        <Inline alignHorizontal="justify" alignVertical="center">
          <Text color="secondary80" size="16px" weight="bold">
            {lang.t('profiles.confirm.set_ens_name')} 􀅵
          </Text>
          <Switch
            disabled={!setSendReverseRecord}
            onValueChange={() =>
              setSendReverseRecord?.(sendReverseRecord => !sendReverseRecord)
            }
            testID="ens-reverse-record-switch"
            trackColor={{ false: colors.white, true: accentColor }}
            value={sendReverseRecord}
          />
        </Inline>
      </Box> */}
          <InfoRow
            booleanDisabled={!isOwner}
            booleanValue={isPrimary}
            explainSheetType="ens_owner"
            label={lang.t('expanded_state.unique_expanded.set_primary_name')}
            useAccentColor
          />
          {owner && (
            <InfoRow
              explainSheetType="ens_owner"
              label={lang.t('expanded_state.unique_expanded.owner')}
              useAccentColor
              value={
                owner.name ||
                formatAddressForDisplay(owner.address || '', 4, 4) ||
                ''
              }
            />
          )}
          {registrant && (
            <InfoRow
              explainSheetType="ens_registrant"
              label={lang.t('expanded_state.unique_expanded.registrant')}
              useAccentColor
              value={
                registrant.name ||
                formatAddressForDisplay(registrant.address || '', 4, 4) ||
                ''
              }
            />
          )}
        </>
      )}
    </Stack>
  );
}
