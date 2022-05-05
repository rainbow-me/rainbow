import { useRoute } from '@react-navigation/core';
import React, { createContext, useMemo } from 'react';
import { StatusBar } from 'react-native';
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
import Routes from '@rainbow-me/routes';
import { addressHashedColorIndex } from '@rainbow-me/utils/profileUtils';

export const ProfileSheetConfigContext = createContext<{
  enableZoomableImages: boolean;
  shouldFadeImages: boolean;
}>({
  enableZoomableImages: false,
  shouldFadeImages: false,
});

export default function ProfileSheet() {
  const { params, name } = useRoute<any>();
  const { colors } = useTheme();

  const { height: deviceHeight } = useDimensions();
  const contentHeight = deviceHeight - SheetHandleFixedToTopHeight;

  const ensName = params?.address;
  const { data: profile, isSuccess } = useENSProfile(ensName);
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

  const enableZoomableImages =
    !params.isPreview && name !== Routes.PROFILE_PREVIEW_SHEET;

  // Only want to fade in images when coming from a loading state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const shouldFadeImages = useMemo(() => !isSuccess || !hasListFetched, []);

  return (
    <ProfileSheetConfigContext.Provider
      value={{ enableZoomableImages, shouldFadeImages }}
    >
      <StatusBar barStyle="light-content" />
      <AccentColorProvider color={accentColor}>
        <Box background="body">
          <Box style={wrapperStyle}>
            {!isSuccess || !hasListFetched ? (
              <Stack space="19px">
                <ProfileSheetHeader isLoading isPreview={params.isPreview} />
                <PlaceholderList />
              </Stack>
            ) : !params.isPreview ? (
              <RecyclerAssetList2 address={profileAddress} type="ens-profile" />
            ) : (
              <ProfileSheetHeader ensName={params?.ensName} isPreview />
            )}
          </Box>
        </Box>
      </AccentColorProvider>
    </ProfileSheetConfigContext.Provider>
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
