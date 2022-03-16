import { useRoute } from '@react-navigation/core';
import React, { useContext, useMemo } from 'react';
import { useQuery } from 'react-query';
import ActionButtons from './ActionButtons/ActionButtons';
import ProfileAvatar from './ProfileAvatar/ProfileAvatar';
import RecordTags from './RecordTags/RecordTags';
import { ModalContext } from '../../react-native-cool-modals/NativeStackView';
import {
  Bleed,
  Box,
  Column,
  Columns,
  Divider,
  Heading,
  Inset,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { web3Provider } from '@rainbow-me/handlers/web3';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';
import { useENSProfile } from '@rainbow-me/hooks';
import { getFirstTransactionTimestamp } from '@rainbow-me/utils/ethereumUtils';
import { addressHashedEmoji } from '@rainbow-me/utils/profileUtils';

export default function ProfileSheetHeader() {
  const { params } = useRoute<any>();
  const { layout } = useContext(ModalContext) || {};

  const ensName = params?.address || 'moxey.eth';
  const { data: profile } = useENSProfile(ensName);
  const avatarUrl = profile?.images.avatarUrl;
  const profileAddress = profile?.primary.address;

  const { data: firstTransactionTimestamp } = useQuery( // TODO those should not be two queries
    ['first-transaction-timestamp', ensName],
    async () => {
      const address = await web3Provider.resolveName(ensName);
      return getFirstTransactionTimestamp(address);
    },
    {
      enabled: Boolean(ensName),
    }
  );

  const emoji = useMemo(
    () => (profileAddress ? addressHashedEmoji(profileAddress) : ''),
    [profileAddress]
  );

  return (
    <Box {...(ios && { onLayout: layout })}>
      <Bleed top={{ custom: 38 }}>
        <Inset horizontal="19px">
          <Columns>
            <Column width="content">
              <ProfileAvatar
                accountSymbol={emoji as string}
                avatarUrl={avatarUrl}
              />
            </Column>
            <Inset top="30px">
              <ActionButtons address={profileAddress} ensName={ensName} />
            </Inset>
          </Columns>
        </Inset>
      </Bleed>
      <Inset horizontal="19px">
        <Stack space="19px">
          <Heading size="23px">{ensName}</Heading>
          {profile?.records.description && (
            <Text containsEmoji weight="medium">
              {profile?.records.description}
            </Text>
          )}
          {profile?.records && (
            <RecordTags
              firstTransactionTimestamp={firstTransactionTimestamp}
              records={profile?.records}
              show={[
                ENS_RECORDS.twitter,
                ENS_RECORDS.website,
                ENS_RECORDS.url,
                ENS_RECORDS.email,
                ENS_RECORDS.github,
                ENS_RECORDS.instagram,
                ENS_RECORDS.reddit,
                ENS_RECORDS.snapchat,
                ENS_RECORDS.telegram,
              ]}
            />
          )}
          <Divider />
        </Stack>
      </Inset>
    </Box>
  );
}
