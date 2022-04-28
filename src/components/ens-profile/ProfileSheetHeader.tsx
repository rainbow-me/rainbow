import { useRoute } from '@react-navigation/core';
import React, { useCallback, useContext, useMemo } from 'react';
import { ModalContext } from '../../react-native-cool-modals/NativeStackView';
import Skeleton from '../skeleton/Skeleton';
import ActionButtons from './ActionButtons/ActionButtons';
import ProfileAvatar from './ProfileAvatar/ProfileAvatar';
import ProfileCover from './ProfileCover/ProfileCover';
import ProfileDescription from './ProfileDescription/ProfileDescription';
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
} from '@rainbow-me/design-system';
import { UniqueAsset } from '@rainbow-me/entities';
import { ENS_RECORDS } from '@rainbow-me/helpers/ens';
import {
  useENSProfile,
  useFetchUniqueTokens,
  useFirstTransactionTimestamp,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { isENSNFTRecord, parseENSNFTRecord } from '@rainbow-me/utils';
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
  const profileAddress = profile?.primary.address;

  const { navigate } = useNavigation();
  const { data: uniqueTokens } = useFetchUniqueTokens({
    address: profileAddress,
  });

  const handleSelectNFT = useCallback(
    (uniqueToken: UniqueAsset) => {
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset: uniqueToken,
        external: true,
        type: 'unique_token',
      });
    },
    [navigate]
  );

  const getUniqueToken = useCallback(
    (avatarOrCover: string) => {
      const { contractAddress, tokenId } = parseENSNFTRecord(avatarOrCover);
      const uniqueToken = uniqueTokens?.find(
        token =>
          token.asset_contract.address === contractAddress &&
          token.id === tokenId
      );
      return uniqueToken;
    },
    [uniqueTokens]
  );

  const {
    enableZoomOnPressAvatar,
    enableZoomOnPressCover,
    onPressAvatar,
    onPressCover,
    avatarUrl,
    coverUrl,
  } = useMemo(() => {
    const avatarUrl = profile?.images.avatarUrl;
    const avatar = profile?.records.avatar;
    const coverUrl = profile?.images.coverUrl;
    const cover = profile?.records.cover;

    const isNFTAvatar = avatar && isENSNFTRecord(avatar);
    const avatarUniqueToken = isNFTAvatar && getUniqueToken(avatar);
    const isNFTCover = cover && isENSNFTRecord(cover);
    const coverUniqueToken = isNFTCover && getUniqueToken(cover);

    const onPressAvatar = () => {
      if (!avatar || !isNFTAvatar || !avatarUniqueToken) return null;
      handleSelectNFT(avatarUniqueToken);
    };

    const onPressCover = () => {
      if (!cover || !isNFTCover || !coverUniqueToken) return null;
      handleSelectNFT(coverUniqueToken);
    };

    const enableZoomOnPressAvatar =
      !avatarUrl || !isNFTAvatar || !avatarUniqueToken;
    const enableZoomOnPressCover =
      !coverUrl || !isNFTCover || !coverUniqueToken;

    return {
      avatarUrl,
      coverUrl,
      enableZoomOnPressAvatar,
      enableZoomOnPressCover,
      onPressAvatar,
      onPressCover,
    };
  }, [
    getUniqueToken,
    handleSelectNFT,
    profile?.images.avatarUrl,
    profile?.images.coverUrl,
    profile?.records.avatar,
    profile?.records.cover,
  ]);

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
        <ProfileCover
          coverUrl={coverUrl}
          enableZoomOnPress={enableZoomOnPressCover}
          handleOnPress={onPressCover}
          isLoading={isLoading}
        />
        <Bleed top={{ custom: 38 }}>
          <Inset horizontal="19px">
            <Columns>
              <Column width="content">
                <ProfileAvatar
                  accountSymbol={emoji as string}
                  avatarUrl={avatarUrl}
                  enableZoomOnPress={enableZoomOnPressAvatar}
                  handleOnPress={onPressAvatar}
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
            <>
              {isLoading ? (
                <DescriptionPlaceholder />
              ) : profile?.records?.description ? (
                <ProfileDescription
                  description={profile?.records?.description}
                />
              ) : null}
            </>
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
            {!isPreview && (
              <Inset bottom="15px">
                <Divider />
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
