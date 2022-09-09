import { useRoute } from '@react-navigation/core';
import React, { createContext, useEffect, useMemo } from 'react';
import { StatusBar } from 'react-native';
import RecyclerAssetList2 from '../components/asset-list/RecyclerAssetList2';
import ProfileSheetHeader from '../components/ens-profile/ProfileSheetHeader';
import Skeleton from '../components/skeleton/Skeleton';
import { analytics } from '@/analytics';
import {
  AccentColorProvider,
  Box,
  Column,
  Columns,
  Inline,
  Inset,
  Stack,
} from '@/design-system';
import { maybeSignUri } from '@/handlers/imgix';
import {
  useAccountSettings,
  useDimensions,
  useENSAddress,
  useENSAvatar,
  useENSFirstTransactionTimestamp,
  useExternalWalletSectionsData,
  usePersistentDominantColorFromImage,
} from '@/hooks';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { addressHashedColorIndex } from '@/utils/profileUtils';

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
  const { data: profileAddress, isSuccess: isAddressSuccess } = useENSAddress(
    ensName
  );
  const { data: avatar, isFetched: isAvatarFetched } = useENSAvatar(ensName);

  const isPreview = name === Routes.PROFILE_PREVIEW_SHEET;

  // Prefetch first transaction timestamp unless already fetched for intro marquee
  const {
    isSuccess: hasFirstTxTimestampFetched,
  } = useENSFirstTransactionTimestamp(name, { enabled: !isPreview });

  // Prefetch asset list
  const {
    isSuccess: hasListFetched,
    briefSectionsData,
  } = useExternalWalletSectionsData({
    address: profileAddress || undefined,
    infinite: true,
  });

  const colorIndex = useMemo(
    () => (profileAddress ? addressHashedColorIndex(profileAddress) : 0),
    [profileAddress]
  );

  const { result: dominantColor, state } = usePersistentDominantColorFromImage(
    maybeSignUri(avatar?.imageUrl ?? '') ?? ''
  );

  const wrapperStyle = useMemo(() => ({ height: contentHeight }), [
    contentHeight,
  ]);

  const accentColor =
    // Set accent color when ENS images have fetched & dominant
    // color is not loading.
    isAvatarFetched && state !== 1 && typeof colorIndex === 'number'
      ? dominantColor ||
        colors.avatarBackgrounds[colorIndex] ||
        colors.appleBlue
      : colors.skeleton;

  const enableZoomableImages = !isPreview;

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
          <Box background="body" testID="profile-sheet">
            <Box style={wrapperStyle}>
              {!isPreview &&
              (!isAddressSuccess ||
                !hasListFetched ||
                !hasFirstTxTimestampFetched) ? (
                <Stack space="19px (Deprecated)">
                  <ProfileSheetHeader isLoading />
                  <PlaceholderList />
                </Stack>
              ) : (
                <RecyclerAssetList2
                  externalAddress={profileAddress || ''}
                  type="ens-profile"
                  walletBriefSectionsData={briefSectionsData}
                />
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
    <Inset horizontal="19px (Deprecated)">
      <Box height="full">
        <Skeleton animated>
          <Stack space="15px (Deprecated)">
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
