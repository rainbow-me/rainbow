import { useRoute } from '@react-navigation/native';
import React, { createContext, useEffect, useMemo } from 'react';
import { Dimensions } from 'react-native';
import RecyclerAssetList2 from '../components/asset-list/RecyclerAssetList2';
import ProfileSheetHeader from '../components/ens-profile/ProfileSheetHeader';
import Skeleton from '../components/skeleton/Skeleton';
import { analytics } from '@/analytics';
import { AccentColorProvider, Box, Column, Columns, Inline, Inset, Stack } from '@/design-system';
import { useAccountSettings, useDimensions, useENSAvatar, useExternalWalletSectionsData } from '@/hooks';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { addressHashedColorIndex } from '@/utils/profileUtils';
import { useFirstTransactionTimestamp } from '@/resources/transactions/firstTransactionTimestampQuery';
import { useENSAddress } from '@/resources/ens/ensAddressQuery';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';

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
  const { data: profileAddress, isSuccess: isAddressSuccess } = useENSAddress({
    name: ensName,
  });
  const { data: avatar, isFetched: isAvatarFetched } = useENSAvatar(ensName);

  const isPreview = name === Routes.PROFILE_PREVIEW_SHEET;

  // Prefetch first transaction timestamp unless already fetched for intro marquee
  const { isSuccess: hasFirstTxTimestampFetched } = useFirstTransactionTimestamp({ addressOrName: ensName });

  // Prefetch asset list
  const { isSuccess: hasListFetched, briefSectionsData } = useExternalWalletSectionsData({
    address: profileAddress || undefined,
  });

  const colorIndex = useMemo(() => (profileAddress ? addressHashedColorIndex(profileAddress) : 0), [profileAddress]);

  const dominantColor = usePersistentDominantColorFromImage(avatar?.imageUrl);

  const wrapperStyle = useMemo(() => ({ height: contentHeight }), [contentHeight]);

  const accentColor =
    // Set accent color when ENS images have fetched & dominant
    // color is not loading.
    isAvatarFetched && typeof colorIndex === 'number'
      ? dominantColor || colors.avatarBackgrounds[colorIndex] || colors.appleBlue
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
        <AccentColorProvider color={accentColor}>
          <Box background="body (Deprecated)" testID="profile-sheet">
            <Box style={wrapperStyle}>
              {!isPreview && (!isAddressSuccess || !hasListFetched || !hasFirstTxTimestampFetched) ? (
                <Stack space="19px (Deprecated)">
                  <ProfileSheetHeader isLoading />
                  <PlaceholderList />
                </Stack>
              ) : (
                <RecyclerAssetList2 externalAddress={profileAddress || ''} type="ens-profile" walletBriefSectionsData={briefSectionsData} />
              )}
            </Box>
          </Box>
        </AccentColorProvider>
      </ProfileSheetConfigContext.Provider>
    </AndroidWrapper>
  );
}

function AndroidWrapper({ children }: { children: React.ReactElement }) {
  const screenHeight = Dimensions.get('screen').height;
  const windowHeight = Dimensions.get('window').height;
  const navbarHeight = screenHeight - windowHeight;

  return android ? (
    <Box borderTopRadius={30} style={{ overflow: 'hidden' }} top={{ custom: navbarHeight }}>
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
          <Box background="body (Deprecated)" borderRadius={15} height={{ custom: 30 }} width={{ custom: 30 }} />
          <Box background="body (Deprecated)" borderRadius={15} height={{ custom: 20 }} width={{ custom: 200 }} />
        </Inline>
      </Column>
    </Columns>
  );
}
