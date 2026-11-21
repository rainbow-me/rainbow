import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { analytics } from '@/analytics';
import { AccentColorProvider, Box, Column, Columns, Inline, Inset, Stack } from '@/design-system';
import { ProfileSheetConfigContext } from '@/features/ens/components/profile/ProfileSheetConfigContext';
import { ProfileSheetHeader } from '@/features/ens/components/profile/ProfileSheetHeader';
import { buildProfileNftRows } from '@/features/ens/data/buildProfileNftRows';
import { useEnsProfileImage } from '@/features/ens/data/stores/imageStore';
import { useEnsAddressStore } from '@/features/ens/data/useEnsAddressStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { NftAssetList } from '@/features/nfts/ui/NftAssetList';
import useDimensions from '@/hooks/useDimensions';
import useHiddenTokens from '@/hooks/useHiddenTokens';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import useShowcaseTokens from '@/hooks/useShowcaseTokens';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { useLegacyNFTs } from '@/resources/nfts';
import { useFirstTransactionTimestamp } from '@/resources/transactions/firstTransactionTimestampQuery';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme/ThemeContext';
import { addressHashedColorIndex } from '@/utils/profileUtils';

import Skeleton from '../components/skeleton/Skeleton';

export function ProfileSheet() {
  const { params, name } = useRoute<RouteProp<RootStackParamList, typeof Routes.PROFILE_SHEET | typeof Routes.PROFILE_PREVIEW_SHEET>>();
  const { colors } = useTheme();
  const { height: deviceHeight } = useDimensions();
  const ensName = params?.address;

  const accountAddress = useAccountAddress();
  const profileAddress = useEnsAddressStore(s => s.get({ addressOrName: ensName, chainId: ChainId.mainnet }));
  const avatar = useEnsProfileImage(ensName, 'avatar');
  const dominantColor = usePersistentDominantColorFromImage(avatar.url);
  const { isSuccess: hasFirstTxTimestampFetched } = useFirstTransactionTimestamp({ addressOrName: ensName });

  const colorIndex = useMemo(() => (profileAddress ? addressHashedColorIndex(profileAddress) : 0), [profileAddress]);
  const accentColor =
    avatar.isSettled && typeof colorIndex === 'number'
      ? dominantColor || colors.avatarBackgrounds[colorIndex] || colors.appleBlue
      : colors.skeleton;

  const isPreview = name === Routes.PROFILE_PREVIEW_SHEET;
  const enableZoomableImages = !isPreview;
  const wrapperStyle = useMemo(() => ({ height: deviceHeight - sharedCoolModalTopOffset }), [deviceHeight]);

  useEffect(() => {
    if (profileAddress && accountAddress) {
      analytics.track(analytics.event.viewedProfile, {
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
              <ProfileNftList
                key={profileAddress}
                address={profileAddress ?? ''}
                profileReady={profileAddress !== undefined && hasFirstTxTimestampFetched}
                isPreview={isPreview}
              />
            </Box>
          </Box>
        </AccentColorProvider>
      </ProfileSheetConfigContext.Provider>
    </AndroidWrapper>
  );
}

function ProfileNftList({ address, profileReady, isPreview }: { address: string; profileReady: boolean; isPreview: boolean }) {
  const {
    data: { nfts },
    isInitialLoading,
  } = useLegacyNFTs({ address });
  const { hiddenTokens } = useHiddenTokens(address);
  const { showcaseTokens } = useShowcaseTokens(address);
  const [openCollections, setOpenCollections] = useState(() => new Set(['showcase']));

  const rows = useMemo(
    () => buildProfileNftRows(nfts, showcaseTokens, hiddenTokens, openCollections),
    [nfts, showcaseTokens, hiddenTokens, openCollections]
  );

  const toggleCollection = useCallback((key: string) => {
    setOpenCollections(previous => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  if (!isPreview && (!profileReady || isInitialLoading)) {
    return (
      <Stack space="19px (Deprecated)">
        <ProfileSheetHeader isLoading />
        <PlaceholderList />
      </Stack>
    );
  }

  return <NftAssetList type="ens-profile" rows={rows} onToggleCollection={toggleCollection} />;
}

function AndroidWrapper({ children }: { children: React.ReactElement }) {
  const safeAreaInsets = useSafeAreaInsets();

  return Platform.OS === 'android' ? (
    <Box borderTopRadius={30} style={{ overflow: 'hidden' }} top={{ custom: safeAreaInsets.top }}>
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
