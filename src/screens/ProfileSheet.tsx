import { useRoute } from '@react-navigation/core';
import ConditionalWrap from 'conditional-wrap';
import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import Spinner from '../components/Spinner';
import RecyclerAssetList2 from '../components/asset-list/RecyclerAssetList2';
import ProfileCover from '../components/ens-profile/ProfileCover/ProfileCover';
import { SheetHandleFixedToTopHeight } from '../components/sheet';
import { sharedCoolModalTopOffset } from '../navigation/config';
import { useTheme } from '@rainbow-me/context';
import { AccentColorProvider, Box, Stack } from '@rainbow-me/design-system';
import { web3Provider } from '@rainbow-me/handlers/web3';
import {
  useDimensions,
  useENSProfile,
  usePersistentDominantColorFromImage,
} from '@rainbow-me/hooks';
import { getFirstTransactionTimestamp } from '@rainbow-me/utils/ethereumUtils';
import { addressHashedColorIndex } from '@rainbow-me/utils/profileUtils';

export default function ProfileSheet() {
  const { params } = useRoute<any>();
  const { colors } = useTheme();

  const { height: deviceHeight } = useDimensions();
  const contentHeight =
    deviceHeight - SheetHandleFixedToTopHeight - sharedCoolModalTopOffset;

  const ensName = params?.address || 'moxey.eth';
  const { isLoading, data: profile } = useENSProfile(ensName);
  const avatarUrl = profile?.images.avatarUrl;
  const coverUrl = profile?.images.coverUrl;
  const profileAddress = profile?.primary.address;

  const { isLoading: isFirstTxnLoading } = useQuery(
    ['first-transaction-timestamp', ensName],
    async () => {
      const address = await web3Provider.resolveName(ensName);
      return getFirstTransactionTimestamp(address);
    },
    {
      enabled: Boolean(ensName),
    }
  );

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
        <ConditionalWrap
          condition={isLoading || isFirstTxnLoading}
          wrap={children => <Box style={wrapperStyle}>{children}</Box>}
        >
          <>
            {isLoading || isFirstTxnLoading ? (
              <Box alignItems="center" height="full" justifyContent="center">
                <Spinner color={colors.appleBlue} size="large" />
              </Box>
            ) : (
              <Stack space="19px">
                <ProfileCover coverUrl={coverUrl} />
                <Box height={{ custom: contentHeight - 126 }}>
                  <RecyclerAssetList2 showcase />
                </Box>
              </Stack>
            )}
          </>
        </ConditionalWrap>
      </Box>
    </AccentColorProvider>
  );
}
