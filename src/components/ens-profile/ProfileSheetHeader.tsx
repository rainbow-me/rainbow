import { useRoute } from '@react-navigation/core';
import React, { useContext, useMemo } from 'react';
import { ModalContext } from '../../react-native-cool-modals/NativeStackView';
import Skeleton from '../skeleton/Skeleton';
import ActionButtons from './ActionButtons/ActionButtons';
import ProfileAvatar from './ProfileAvatar/ProfileAvatar';
import ProfileCover from './ProfileCover/ProfileCover';
import RecordTags, {
  Placeholder as RecordTagsPlaceholder,
} from './RecordTags/RecordTags';
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
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';
import { useENSProfile, useFirstTransactionTimestamp } from '@rainbow-me/hooks';
import { addressHashedEmoji } from '@rainbow-me/utils/profileUtils';

export default function ProfileSheetHeader({
  ensName: defaultEnsName,
  isLoading,
  isPreview,
}: {
  ensName?: string;
  isLoading?: boolean;
  isPreview?: boolean;
}) {
  const { params } = useRoute<any>();
  const { layout } = useContext(ModalContext) || {};

  const ensName = defaultEnsName || params?.address;
  const { data: profile } = useENSProfile(ensName);
  const avatarUrl = profile?.images.avatarUrl;
  const coverUrl = profile?.images.coverUrl;
  const profileAddress = profile?.primary.address;

  const { data: firstTransactionTimestamp } = useFirstTransactionTimestamp({
    ensName,
  });

  const emoji = useMemo(
    () => (profileAddress ? addressHashedEmoji(profileAddress) : ''),
    [profileAddress]
  );

  return (
    <Box
      {...(ios && { onLayout: (e: any) => setTimeout(() => layout(e), 500) })}
    >
      <Stack space="19px">
        <ProfileCover coverUrl={coverUrl} isLoading={isLoading} />
        <Bleed top={{ custom: 38 }}>
          <Inset horizontal="19px">
            <Columns>
              <Column width="content">
                <ProfileAvatar
                  accountSymbol={emoji as string}
                  avatarUrl={avatarUrl}
                  isLoading={isLoading}
                />
              </Column>
              {!isLoading && (
                <Inset top="30px">
                  <ActionButtons address={profileAddress} ensName={ensName} />
                </Inset>
              )}
            </Columns>
          </Inset>
        </Bleed>
        <Inset horizontal="19px">
          <Stack space="19px">
            <Heading size="23px">{ensName}</Heading>
            {!isPreview && (
              <>
                {isLoading ? (
                  <DescriptionPlaceholder />
                ) : (
                  <>
                    {profile?.records.description && (
                      <Text containsEmoji weight="medium">
                        {profile?.records.description}
                      </Text>
                    )}
                  </>
                )}
              </>
            )}
            <Bleed horizontal="19px">
              {isLoading ? (
                <RecordTagsPlaceholder />
              ) : (
                <>
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
                </>
              )}
            </Bleed>
            {!isPreview && <Divider />}
          </Stack>
        </Inset>
      </Stack>
    </Box>
  );
}

function DescriptionPlaceholder() {
  return (
    <Box height={{ custom: 40 }}>
      <Skeleton animated>
        <Stack space="8px">
          <Box
            background="body"
            borderRadius={10}
            height={{ custom: 14 }}
            width="full"
          />
          <Box
            background="body"
            borderRadius={10}
            height={{ custom: 14 }}
            width="1/3"
          />
        </Stack>
      </Skeleton>
    </Box>
  );
}
