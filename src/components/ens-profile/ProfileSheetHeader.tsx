import { useRoute } from '@react-navigation/native';
import React, { useContext, useMemo } from 'react';
import { ModalContext } from '../../react-native-cool-modals/NativeStackView';
import { ProfileSheetConfigContext } from '../../screens/ProfileSheet';
import Skeleton from '../skeleton/Skeleton';
import ActionButtons from './ActionButtons/ActionButtons';
import ProfileAvatar from './ProfileAvatar/ProfileAvatar';
import ProfileCover from './ProfileCover/ProfileCover';
import ProfileDescription from './ProfileDescription/ProfileDescription';
import RecordTags, { Placeholder as RecordTagsPlaceholder } from './RecordTags/RecordTags';
import { abbreviateEnsForDisplay } from '@/utils/abbreviations';
import { PROFILES, useExperimentalFlag } from '@/config';
import { Bleed, Box, Column, Columns, Heading, Inset, Separator, Stack } from '@/design-system';
import { ENS_RECORDS } from '@/helpers/ens';
import { useENSAvatar, useENSCover, useENSRecords, useOpenENSNFTHandler } from '@/hooks';
import { addressHashedEmoji } from '@/utils/profileUtils';
import { useFirstTransactionTimestamp } from '@/resources/transactions/firstTransactionTimestampQuery';
import { useENSAddress } from '@/resources/ens/ensAddressQuery';
import { useLegacyNFTs } from '@/resources/nfts';

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
  const { enableZoomableImages } = useContext(ProfileSheetConfigContext);
  const { layout } = useContext(ModalContext) || {};
  const profilesEnabled = useExperimentalFlag(PROFILES);
  const ensName = defaultEnsName || params?.address;

  const { data: profileAddress } = useENSAddress(
    { name: ensName },
    {
      enabled: profilesEnabled,
    }
  );
  const { data: { coinAddresses, contenthash, records } = {} } = useENSRecords(ensName, {
    enabled: profilesEnabled,
  });
  const { data: avatar, isFetched: isAvatarFetched } = useENSAvatar(ensName, {
    enabled: profilesEnabled,
  });
  const { data: cover, isFetched: isCoverFetched } = useENSCover(ensName, {
    enabled: profilesEnabled,
  });
  const isImagesFetched = isAvatarFetched && isCoverFetched;

  const {
    data: { nfts: uniqueTokens },
  } = useLegacyNFTs({
    address: profileAddress ?? '',
  });

  const avatarUrl = avatar?.imageUrl;
  const { onPress: onPressAvatar } = useOpenENSNFTHandler({
    uniqueTokens,
    value: records?.avatar,
  });
  const enableZoomOnPressAvatar = enableZoomableImages && !onPressAvatar;

  const { onPress: onPressCover } = useOpenENSNFTHandler({
    uniqueTokens,
    value: records?.header,
  });
  const enableZoomOnPressCover = enableZoomableImages && !onPressCover;

  const { data: firstTransactionTimestamp } = useFirstTransactionTimestamp({
    addressOrName: profileAddress ?? '',
  });

  const emoji = useMemo(() => (profileAddress ? addressHashedEmoji(profileAddress) : ''), [profileAddress]);

  return (
    <Box background="body (Deprecated)" {...(ios && { onLayout: (e: any) => setTimeout(() => layout(e), 500) })}>
      <Stack space={{ custom: 18 }}>
        <ProfileCover
          coverUrl={cover?.imageUrl}
          enableZoomOnPress={enableZoomOnPressCover}
          handleOnPress={onPressCover}
          isFetched={isImagesFetched}
        />
        <Bleed top={{ custom: 38 }}>
          <Inset left="19px (Deprecated)" right="15px (Deprecated)" top={{ custom: 1 }}>
            <Columns>
              <Column width="content">
                <ProfileAvatar
                  accountSymbol={emoji as string}
                  avatarUrl={avatarUrl}
                  enableZoomOnPress={enableZoomOnPressAvatar}
                  handleOnPress={onPressAvatar}
                  isFetched={isImagesFetched}
                />
              </Column>
              {!isLoading && (
                <Inset top="34px (Deprecated)">
                  <ActionButtons address={profileAddress ?? ''} avatarUrl={avatarUrl} ensName={ensName} />
                </Inset>
              )}
            </Columns>
          </Inset>
        </Bleed>
        <Inset horizontal="19px (Deprecated)">
          <Stack space="19px (Deprecated)">
            <Heading color="primary (Deprecated)" size="23px / 27px (Deprecated)" weight="heavy">
              {abbreviateEnsForDisplay(ensName)}
            </Heading>
            <>
              {isLoading ? (
                <DescriptionPlaceholder />
              ) : records?.description ? (
                <ProfileDescription description={records?.description} />
              ) : null}
            </>
            <Bleed horizontal="19px (Deprecated)">
              {isLoading ? (
                <RecordTagsPlaceholder />
              ) : (
                <>
                  {records && (
                    <RecordTags
                      firstTransactionTimestamp={firstTransactionTimestamp}
                      records={{
                        contenthash,
                        ...records,
                        ...coinAddresses,
                      }}
                      show={[
                        ENS_RECORDS.name,
                        ENS_RECORDS.displayName,
                        ENS_RECORDS.url,
                        ENS_RECORDS.twitter,
                        ENS_RECORDS.email,
                        ENS_RECORDS.instagram,
                        ENS_RECORDS.discord,
                        ENS_RECORDS.github,
                        ENS_RECORDS.BTC,
                        ENS_RECORDS.snapchat,
                        ENS_RECORDS.telegram,
                        ENS_RECORDS.reddit,
                        ENS_RECORDS.pronouns,
                        ENS_RECORDS.notice,
                        ENS_RECORDS.keywords,
                        ENS_RECORDS.LTC,
                        ENS_RECORDS.DOGE,
                      ]}
                    />
                  )}
                </>
              )}
            </Bleed>
            {!isPreview && (
              <Inset bottom="6px">
                <Separator color="divider60 (Deprecated)" />
              </Inset>
            )}
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
          <Box background="body (Deprecated)" borderRadius={10} height={{ custom: 14 }} width="full" />
          <Box background="body (Deprecated)" borderRadius={10} height={{ custom: 14 }} width="1/3" />
        </Stack>
      </Skeleton>
    </Box>
  );
}
