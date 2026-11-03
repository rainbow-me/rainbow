import React, { useContext, useMemo } from 'react';
import { Platform } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';

import Skeleton from '@/components/skeleton/Skeleton';
import { Bleed, Box, Column, Columns, Heading, Inset, Separator, Stack } from '@/design-system';
import { abbreviateName } from '@/features/address/core/formatAddress';
import { PROFILES } from '@/features/config/constants/experimental';
import { useExperimentalFlag } from '@/features/config/hooks/experimentalHooks';
import { ChainId } from '@/features/network/types/backendNetworks';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { ModalContext } from '@/react-native-cool-modals/NativeStackView';
import { useLegacyNFTs } from '@/resources/nfts';
import { useFirstTransactionTimestamp } from '@/resources/transactions/firstTransactionTimestampQuery';
import { addressHashedEmoji } from '@/utils/profileUtils';

import { useEnsProfileImage } from '../../data/stores/imageStore';
import { useEnsRecordsStore } from '../../data/stores/recordsStore';
import { useEnsAddressStore } from '../../data/useEnsAddressStore';
import useOpenENSNFTHandler from '../../hooks/useOpenENSNFTHandler';
import { ActionButtons } from './ActionButtons/ActionButtons';
import { ProfileAvatar } from './ProfileAvatar';
import { ProfileCover } from './ProfileCover';
import { ProfileDescription } from './ProfileDescription';
import { ProfileSheetConfigContext } from './ProfileSheetConfigContext';
import { RecordTags, Placeholder as RecordTagsPlaceholder } from './RecordTags';

export function ProfileSheetHeader({
  ensName: defaultEnsName,
  isLoading,
  isPreview,
}: {
  ensName?: string;
  isLoading?: boolean;
  isPreview?: boolean;
}) {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.PROFILE_SHEET>>();
  const modal = useContext(ModalContext);
  const { enableZoomableImages } = useContext(ProfileSheetConfigContext);
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const ensName = defaultEnsName || params?.address;
  const profileName = profilesEnabled && ensName ? ensName : undefined;
  const profileAddress = useEnsAddressStore(s => s.get(profilesEnabled ? { addressOrName: ensName, chainId: ChainId.mainnet } : undefined));
  const profile = useEnsRecordsStore(s => s.get(profileName));
  const avatar = useEnsProfileImage(profileName, 'avatar');
  const cover = useEnsProfileImage(profileName, 'header');

  const { data: walletNfts } = useLegacyNFTs({ address: profileAddress ?? '' });
  const { data: firstTransactionTimestamp } = useFirstTransactionTimestamp({ addressOrName: profileAddress ?? '' });

  const { onPress: onPressAvatar } = useOpenENSNFTHandler({ uniqueTokens: walletNfts.nfts, value: profile?.records.avatar });
  const { onPress: onPressCover } = useOpenENSNFTHandler({ uniqueTokens: walletNfts.nfts, value: profile?.records.header });
  const emoji = useMemo(() => (profileAddress ? addressHashedEmoji(profileAddress) : ''), [profileAddress]);

  return (
    <Box background="body (Deprecated)" onLayout={Platform.OS === 'ios' && modal ? () => setTimeout(modal.layout, 500) : undefined}>
      <Stack space={{ custom: 18 }}>
        <ProfileCover
          coverUrl={cover.url}
          enableZoomOnPress={enableZoomableImages && !onPressCover}
          handleOnPress={onPressCover}
          isFetched={cover.isSettled}
        />
        <Bleed top={{ custom: 38 }}>
          <Inset left="19px (Deprecated)" right="15px (Deprecated)" top={{ custom: 1 }}>
            <Columns>
              <Column width="content">
                <ProfileAvatar
                  accountSymbol={emoji}
                  avatarUrl={avatar.url}
                  enableZoomOnPress={enableZoomableImages && !onPressAvatar}
                  handleOnPress={onPressAvatar}
                  isFetched={avatar.isSettled}
                />
              </Column>
              {!isLoading && (
                <Inset top="34px (Deprecated)">
                  <ActionButtons address={profileAddress ?? ''} avatarUrl={avatar.url} ensName={ensName} />
                </Inset>
              )}
            </Columns>
          </Inset>
        </Bleed>
        <Inset horizontal="19px (Deprecated)">
          <Stack space="19px (Deprecated)">
            <Heading color="primary (Deprecated)" size="23px / 27px (Deprecated)" weight="heavy">
              {abbreviateName(ensName)}
            </Heading>
            {isLoading ? (
              <DescriptionPlaceholder />
            ) : profile?.records.description ? (
              <ProfileDescription description={profile.records.description} />
            ) : null}
            <Bleed horizontal="19px (Deprecated)">
              {isLoading ? (
                <RecordTagsPlaceholder />
              ) : profile ? (
                <RecordTags firstTransactionTimestamp={firstTransactionTimestamp} profile={profile} />
              ) : null}
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
