import { useRoute } from '@react-navigation/core';
import React, { useMemo } from 'react';
import Spinner from '../components/Spinner';
import RecyclerAssetList2 from '../components/asset-list/RecyclerAssetList2';
import { SheetHandleFixedToTopHeight } from '../components/sheet';
import { useTheme } from '@rainbow-me/context';
import { AccentColorProvider, Box } from '@rainbow-me/design-system';
import {
  useDimensions,
  useENSProfile,
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
  const { isLoading, data: profile } = useENSProfile(ensName);
  const avatarUrl = profile?.images.avatarUrl;
  const profileAddress = profile?.primary.address;

  // Prefetch first transaction timestamp
  useFirstTransactionTimestamp({ ensName });

  // Prefetch asset list
  useExternalWalletSectionsData({
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
          {isLoading ? (
            <Box alignItems="center" height="full" justifyContent="center">
              <Spinner color={colors.appleBlue} size="large" />
            </Box>
          ) : (
            <RecyclerAssetList2 address={profileAddress} type="ens-profile" />
          )}
        </Box>
      </Box>
    </AccentColorProvider>
  );
}
