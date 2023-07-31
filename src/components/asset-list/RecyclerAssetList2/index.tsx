import React, { useMemo } from 'react';
import { Animated as RNAnimated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemoOne } from 'use-memo-one';
import { RecyclerAssetListScrollPositionContext } from './core/Contexts';
import RawMemoRecyclerAssetList from './core/RawRecyclerList';
import { StickyHeaderManager } from './core/StickyHeaders';
import useMemoBriefSectionData from './core/useMemoBriefSectionData';
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
import { Box } from '@/design-system';
import { UniqueAsset } from '@/entities';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { ProfileNameRow } from './profile-header/ProfileNameRow';

export type AssetListType = 'wallet' | 'ens-profile' | 'select-nft';

function RecyclerAssetList({
  accentColor,
  disablePullDownToRefresh,
  externalAddress,
  onPressUniqueToken,
  type = 'wallet',
  walletBriefSectionsData,
}: {
  accentColor?: string;
  disablePullDownToRefresh?: boolean;
  /** An "external address" is an address that is not the current account address. */
  externalAddress?: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
  type?: AssetListType;
  walletBriefSectionsData: any[];
}) {
  const {
    memoizedResult: briefSectionsData,
    additionalData,
  } = useMemoBriefSectionData({
    briefSectionsData: walletBriefSectionsData,
    externalAddress,
    type,
  });

  const insets = useSafeAreaInsets();

  const position = useMemoOne(
    () => new RNAnimated.Value(type === 'wallet' ? -insets.top : 0),
    []
  );

  const extendedState = useMemo(
    () => ({ additionalData, externalAddress, onPressUniqueToken }),
    [additionalData, externalAddress, onPressUniqueToken]
  );

  return (
    <RecyclerAssetListScrollPositionContext.Provider value={position}>
      {ios && type === 'wallet' && (
        <NavbarOverlay accentColor={accentColor} position={position} />
      )}
      <StickyHeaderManager yOffset={ios ? navbarHeight + insets.top - 8 : 0}>
        <RawMemoRecyclerAssetList
          briefSectionsData={briefSectionsData}
          disablePullDownToRefresh={!!disablePullDownToRefresh}
          extendedState={extendedState}
          scrollIndicatorInsets={{ bottom: 40, top: 40 }}
          type={type}
        />
      </StickyHeaderManager>
    </RecyclerAssetListScrollPositionContext.Provider>
  );
}

export default React.memo(RecyclerAssetList);

// //////////////////////////////////////////////////////////

function NavbarOverlay({
  accentColor,
  position,
}: {
  accentColor?: string;
  position: RNAnimated.Value;
}) {
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const handlePressQRScanner = React.useCallback(() => {
    navigate(Routes.QR_SCANNER_SCREEN);
  }, [navigate]);

  const handlePressSettings = React.useCallback(() => {
    navigate(Routes.SETTINGS_SHEET);
  }, [navigate]);

  const yOffset = 0;
  const shadowOpacityStyle = useMemo(
    () => ({
      shadowOpacity: position!.interpolate({
        extrapolate: 'clamp',
        inputRange: [0, yOffset, yOffset + 19],
        outputRange: [0, 0, isDarkMode ? 0.2 : 1],
      }),
    }),
    [isDarkMode, position, yOffset]
  );
  const animatedStyle = useMemo(
    () => ({
      opacity: position!.interpolate({
        extrapolate: 'clamp',
        inputRange: [0, yOffset, yOffset + 38],
        outputRange: [0, 1, 1],
      }),
      shadowOpacity: position!.interpolate({
        extrapolate: 'clamp',
        inputRange: [0, yOffset, yOffset + 19],
        outputRange: [0, 0, isDarkMode ? 0.2 : 0],
      }),
      transform: [
        {
          translateY: position!.interpolate({
            extrapolate: 'clamp',
            inputRange: [0, yOffset, yOffset + 38],
            outputRange: [0, 24, 0],
          }),
        },
      ],
    }),
    [isDarkMode, position, yOffset]
  );
  const walletNameStyle = useMemo(
    () => ({
      opacity: position!.interpolate({
        extrapolate: 'clamp',
        inputRange: [0, yOffset, yOffset + 38],
        outputRange: [0, 1, 1],
      }),
      transform: [
        {
          translateY: position!.interpolate({
            extrapolate: 'clamp',
            inputRange: [0, yOffset, yOffset + 38],
            outputRange: [0, 38, 0],
          }),
        },
      ],
    }),
    [position, yOffset]
  );

  return (
    <Box
      as={RNAnimated.View}
      style={[
        {
          shadowColor: isDarkMode
            ? colors.shadowBlack
            : colors.separatorTertiary,
          shadowOffset: { width: 0, height: isDarkMode ? 4 : 1 },
          // shadowOpacity: isDarkMode ? 0.4 : 0.04,
          shadowRadius: isDarkMode ? 20 : 0,
          zIndex: 1,
        },
        shadowOpacityStyle,
      ]}
    >
      <Box
        as={RNAnimated.View}
        background="surfacePrimary"
        style={[
          {
            height: navbarHeight + insets.top + 24,
            width: '100%',
            position: 'absolute',
            shadowColor: colors.shadowBlack,
            shadowOffset: { width: 0, height: 1 },
            // shadowOpacity: isDarkMode ? 0.4 : 0.04,
            shadowRadius: 3,
            top: navbarHeight + insets.top - 24,
          },
          animatedStyle,
        ]}
      >
        <Box
          background="surfacePrimary"
          style={{
            alignItems: 'center',
            // borderBottomColor: colors.alpha('#F5F8FF', 0.05),
            // borderBottomWidth: 0.5,
            height: navbarHeight,
            justifyContent: 'center',
            // shadowColor: '#F5F8FF',
            // shadowOffset: { width: 0, height: 0.5 },
            // shadowOpacity: isDarkMode ? 0.08 : 0,
            // shadowRadius: 0,
            top: insets.top + 24,
          }}
        />
      </Box>
      <Box style={{ top: navbarHeight + insets.top, zIndex: 100 }}>
        <Navbar
          hasStatusBarInset
          leftComponent={
            <Navbar.Item onPress={handlePressQRScanner}>
              <Navbar.TextIcon color={accentColor} icon="􀎹" />
            </Navbar.Item>
          }
          rightComponent={
            <Navbar.Item onPress={handlePressSettings}>
              <Navbar.TextIcon color={accentColor} icon="􀍠" />
            </Navbar.Item>
          }
          titleComponent={
            <Box
              alignItems="center"
              as={RNAnimated.View}
              height={{ custom: navbarHeight }}
              justifyContent="center"
              style={[walletNameStyle, { alignSelf: 'center', bottom: 2 }]}
            >
              <ProfileNameRow variant="header" />
            </Box>
          }
        />
      </Box>
    </Box>
  );
}
