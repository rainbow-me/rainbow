import { useRoute } from '@react-navigation/core';
import React, { useMemo } from 'react';
import RecyclerAssetList2 from '../components/asset-list/RecyclerAssetList2';
import ProfileSheetHeader from '../components/ens-profile/ProfileSheetHeader';
import { SheetHandleFixedToTopHeight } from '../components/sheet';
import Skeleton from '../components/skeleton/Skeleton';
import useENSProfile from '../hooks/useENSProfile';
import { useTheme } from '@rainbow-me/context';
import {
  AccentColorProvider,
  Box,
  Column,
  Columns,
  Inline,
  Inset,
  Stack,
} from '@rainbow-me/design-system';
import {
  useDimensions,
  useENSResolveName,
  useExternalWalletSectionsData,
  useFirstTransactionTimestamp,
  usePersistentDominantColorFromImage,
} from '@rainbow-me/hooks';
import { addressHashedColorIndex } from '@rainbow-me/utils/profileUtils';

export default function ProfileSheet() {
  const { params } = useRoute<any>();
  const { colors } = useTheme();

  const { height: deviceHeight } = useDimensions();
  const contentHeight = deviceHeight - SheetHandleFixedToTopHeight;

  const ensName = params?.address || 'moxey.eth';
  const { data: profile } = useENSProfile(ensName);
  const avatarUrl = profile?.images?.avatarUrl;

  const { data: profileAddress } = useENSResolveName(ensName);

  // Prefetch first transaction timestamp
  useFirstTransactionTimestamp({
    ensName,
  });

  // Prefetch asset list
  const { isSuccess: hasListFetched } = useExternalWalletSectionsData({
    address: profileAddress,
  });

  const colorIndex = useMemo(
    () => (profileAddress ? addressHashedColorIndex(profileAddress) : 0),
    [profileAddress]
  );

  const { result: dominantColor } = usePersistentDominantColorFromImage(
    avatarUrl || ''
  );

  const wrapperStyle = useMemo(() => ({ height: contentHeight }), [
    contentHeight,
  ]);

  const accentColor =
    dominantColor ||
    colors.avatarBackgrounds[colorIndex || 0] ||
    colors.appleBlue;

  return (
    <AccentColorProvider color={accentColor}>
      <Box background="body">
        <Box style={wrapperStyle}>
          {!hasListFetched ? (
            <Stack space="19px">
              <ProfileSheetHeader isLoading />
              <PlaceholderList />
            </Stack>
          ) : (
            <RecyclerAssetList2 address={profileAddress} type="ens-profile" />
          )}
        </Box>
      </Box>
    </AccentColorProvider>
  );
}

function PlaceholderList() {
  return (
    <Inset horizontal="19px">
      <Box height="full">
        <Skeleton animated>
          <Stack space="15px">
            <PlaceholderRow />
            <PlaceholderRow />
            <PlaceholderRow />
            <PlaceholderRow />
            <PlaceholderRow />
          </Stack>
        </Skeleton>
      </Box>
    </Inset>
  );
}

function PlaceholderRow() {
  return (
    <Columns>
      <Column width="content">
        <Inline alignVertical="center" space="10px" wrap={false}>
          <Box
            background="body"
            borderRadius={15}
            height={{ custom: 30 }}
            width={{ custom: 30 }}
          />
          <Box
            background="body"
            borderRadius={15}
            height={{ custom: 20 }}
            width={{ custom: 200 }}
          />
        </Inline>
      </Column>
    </Columns>
  );
}
