import { useRoute } from '@react-navigation/core';
import React, { useCallback, useContext, useMemo } from 'react';
import { ModalContext } from '../../react-native-cool-modals/NativeStackView';
import { ProfileSheetConfigContext } from '../../screens/ProfileSheet';
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
  useENSProfileImages,
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
  const { enableZoomableImages } = useContext(ProfileSheetConfigContext);
  const { layout } = useContext(ModalContext) || {};

  const ensName = defaultEnsName || params?.address;
  const { data: profile } = useENSProfile(ensName);
  const { data: images, isFetched: isImagesFetched } = useENSProfileImages(
    ensName
  );
  const profileAddress = profile?.primary?.address ?? '';
  const { navigate } = useNavigation();
  const { data: uniqueTokens } = useFetchUniqueTokens({
    address: profileAddress,
  });

  const handleSelectNFT = useCallback(
    (uniqueToken: UniqueAsset) => {
      navigate(Routes.EXPANDED_ASSET_SHEET, {
        asset: uniqueToken,
        backgroundOpacity: 1,
        cornerRadius: 'device',
        external: true,
        springDamping: 1,
        topOffset: 0,
        transitionDuration: 0.25,
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

  const avatarUrl = images?.avatarUrl;

  const { enableZoomOnPressAvatar, onPressAvatar } = useMemo(() => {
    const avatar = profile?.records?.avatar;

    const isNFTAvatar = avatar && isENSNFTRecord(avatar);
    const avatarUniqueToken = isNFTAvatar && getUniqueToken(avatar);

    const onPressAvatar = avatarUniqueToken
      ? () => handleSelectNFT(avatarUniqueToken)
      : undefined;

    const enableZoomOnPressAvatar = enableZoomableImages && !onPressAvatar;

    return {
      enableZoomOnPressAvatar,
      onPressAvatar,
    };
  }, [
    enableZoomableImages,
    getUniqueToken,
    handleSelectNFT,
    profile?.records?.avatar,
  ]);

  const coverUrl = images?.coverUrl;

  const { enableZoomOnPressCover, onPressCover } = useMemo(() => {
    const cover = profile?.records?.cover;

    const isNFTCover = cover && isENSNFTRecord(cover);
    const coverUniqueToken = isNFTCover && getUniqueToken(cover);

    const onPressCover = coverUniqueToken
      ? () => handleSelectNFT(coverUniqueToken)
      : undefined;

    const enableZoomOnPressCover = enableZoomableImages && !onPressCover;

    return {
      coverUrl,
      enableZoomOnPressCover,
      onPressCover,
    };
  }, [
    coverUrl,
    enableZoomableImages,
    getUniqueToken,
    handleSelectNFT,
    profile?.records?.cover,
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
      background="body"
      {...(ios && { onLayout: (e: any) => setTimeout(() => layout(e), 500) })}
    >
      <Stack space={{ custom: 18 }}>
        <ProfileCover
          coverUrl={coverUrl}
          enableZoomOnPress={enableZoomOnPressCover}
          handleOnPress={onPressCover}
          isFetched={isImagesFetched}
        />
        <Bleed top={{ custom: 38 }}>
          <Inset left="19px" right="15px" top={{ custom: 1 }}>
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
                <Inset top="34px">
                  <ActionButtons
                    address={profileAddress}
                    avatarUrl={avatarUrl}
                    ensName={ensName}
                  />
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
                      records={{
                        ...profile?.records,
                        ...profile?.coinAddresses,
                      }}
                      show={[
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
                <Divider color="divider60" />
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
