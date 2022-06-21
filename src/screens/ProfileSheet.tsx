import { useRoute } from '@react-navigation/core';
import analytics from '@segment/analytics-react-native';
import React, { createContext, useEffect, useMemo } from 'react';
import { StatusBar } from 'react-native';
import RecyclerAssetList2 from '../components/asset-list/RecyclerAssetList2';
import ProfileSheetHeader from '../components/ens-profile/ProfileSheetHeader';
import Skeleton from '../components/skeleton/Skeleton';
import {
  AccentColorProvider,
  Box,
  Column,
  Columns,
  Inline,
  Inset,
  Stack,
} from '@rainbow-me/design-system';
import { maybeSignUri } from '@rainbow-me/handlers/imgix';
import {
  useAccountSettings,
  useDimensions,
  useENSProfile,
  useENSProfileImages,
  useENSResolveName,
  useExternalWalletSectionsData,
  useFirstTransactionTimestamp,
  usePersistentDominantColorFromImage,
} from '@rainbow-me/hooks';
import { sharedCoolModalTopOffset } from '@rainbow-me/navigation/config';
import Routes from '@rainbow-me/routes';
import { useTheme } from '@rainbow-me/theme';
import { addressHashedColorIndex } from '@rainbow-me/utils/profileUtils';

export const ProfileSheetConfigContext = createContext<{
  enableZoomableImages: boolean;
}>({
  enableZoomableImages: false,
});

export default function ProfileSheet() {
  const { params, name } = useRoute<any>();
  const { colors } = useTheme();
  const { accountAddress } = useAccountSettings();

  const { height: deviceHeight } = useDimensions();
  const contentHeight = deviceHeight - sharedCoolModalTopOffset;

  const ensName = params?.address;
  const { isSuccess } = useENSProfile(ensName);
  const { data: images, isFetched: isImagesFetched } = useENSProfileImages(
    ensName
  );
  const avatarUrl = images?.avatarUrl;

  const { data: profileAddress } = useENSResolveName(ensName);

  // Prefetch first transaction timestamp
  useFirstTransactionTimestamp({
    ensName,
  });

  // Prefetch asset list
  const {
    isSuccess: hasListFetched,
    briefSectionsData,
  } = useExternalWalletSectionsData({
    address: profileAddress,
  });

  const colorIndex = useMemo(
    () => (profileAddress ? addressHashedColorIndex(profileAddress) : 0),
    [profileAddress]
  );

  const { result: dominantColor, state } = usePersistentDominantColorFromImage(
    maybeSignUri(avatarUrl || '') || ''
  );

  const wrapperStyle = useMemo(() => ({ height: contentHeight }), [
    contentHeight,
  ]);

  const accentColor =
    // Set accent color when ENS images have fetched & dominant
    // color is not loading.
    isImagesFetched && state !== 1 && typeof colorIndex === 'number'
      ? dominantColor ||
        colors.avatarBackgrounds[colorIndex] ||
        colors.appleBlue
      : colors.skeleton;

  const enableZoomableImages =
    !params.isPreview && name !== Routes.PROFILE_PREVIEW_SHEET;

  useEffect(() => {
    if (profileAddress && accountAddress) {
      analytics.track('Viewed profile', {
        category: 'profiles',
        fromRoute: params.fromRoute,
        name: profileAddress !== accountAddress ? ensName : '',
      });
    }
  }, [params, ensName, profileAddress, accountAddress]);

  return (
    <AndroidWrapper>
      <ProfileSheetConfigContext.Provider value={{ enableZoomableImages }}>
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
                <RecyclerAssetList2
                  externalAddress={profileAddress}
                  type="ens-profile"
                  walletBriefSectionsData={briefSectionsData}
                />
              ) : (
                <ProfileSheetHeader ensName={params?.ensName} isPreview />
              )}
            </Box>
          </Box>
        </AccentColorProvider>
      </ProfileSheetConfigContext.Provider>
    </AndroidWrapper>
  );
}

function AndroidWrapper({ children }: { children: React.ReactElement }) {
  return android ? (
    <Box
      borderTopRadius={30}
      style={{ overflow: 'hidden' }}
      top={{ custom: StatusBar.currentHeight || 0 }}
    >
      {children}
    </Box>
  ) : (
    children
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
