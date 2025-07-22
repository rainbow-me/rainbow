import React, { useMemo } from 'react';
import { Animated as RNAnimated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RecyclerAssetListScrollPositionContext } from './core/Contexts';
import RawMemoRecyclerAssetList, { ViewableItemsChangedCallback } from './core/RawRecyclerList';
import { StickyHeaderManager } from './core/StickyHeaders';
import useMemoBriefSectionData from './core/useMemoBriefSectionData';
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
import { Box } from '@/design-system';
import { UniqueAsset } from '@/entities';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { ProfileNameRow } from './profile-header/ProfileNameRow';
import { analytics } from '@/analytics';
import * as lang from '@/languages';
import { useWalletSectionsData } from '@/hooks';
import { DropdownMenu, MenuItem } from '@/components/DropdownMenu';
import { IS_ANDROID, IS_TEST, IS_DEV } from '@/env';
import { useStableValue } from '@/hooks/useStableValue';
import { KING_OF_THE_HILL_TAB, useExperimentalFlag } from '@/config';
import { useRemoteConfig } from '@/model/remoteConfig';

export type AssetListType = 'wallet' | 'ens-profile' | 'select-nft';

type Item = MenuItem<(typeof Routes)[keyof typeof Routes]>;

const menuItems: Item[] = [
  {
    actionKey: Routes.SETTINGS_SHEET,
    actionTitle: lang.t(lang.l.settings.label),
    icon: { iconType: 'SYSTEM', iconValue: 'gear' },
  },
  {
    actionKey: Routes.RECEIVE_MODAL,
    actionTitle: lang.t(lang.l.button.my_qr_code),
    icon: { iconType: 'SYSTEM', iconValue: 'qrcode' },
  },
  {
    actionKey: Routes.CONNECTED_DAPPS,
    actionTitle: lang.t(lang.l.wallet.connected_apps),
    icon: { iconType: 'SYSTEM', iconValue: 'app.badge.checkmark' },
  },
  ...(IS_DEV
    ? [
        {
          actionKey: Routes.DEV_ACTION_SHEET,
          actionTitle: 'Dev Actions',
          icon: { iconType: 'SYSTEM', iconValue: 'ladybug' },
        } satisfies Item,
      ]
    : []),
];

export interface RecyclerAssetList2Props {
  accentColor?: string;
  disablePullDownToRefresh?: boolean;
  externalAddress?: string;
  onPressUniqueToken?: (asset: UniqueAsset) => void;
  type?: AssetListType;
  walletBriefSectionsData: ReturnType<typeof useWalletSectionsData>['briefSectionsData'];
  onEndReached?: () => void;
  onViewableItemsChanged?: ViewableItemsChangedCallback;
}

function RecyclerAssetList({
  accentColor,
  disablePullDownToRefresh,
  externalAddress,
  onPressUniqueToken,
  type = 'wallet',
  walletBriefSectionsData,
  onEndReached,
  onViewableItemsChanged,
}: RecyclerAssetList2Props) {
  const { memoizedResult: briefSectionsData, additionalData } = useMemoBriefSectionData({
    briefSectionsData: walletBriefSectionsData,
    externalAddress,
    type,
  });

  const insets = useSafeAreaInsets();

  const position = useStableValue(() => new RNAnimated.Value(0));

  const extendedState = useMemo(
    () => ({ additionalData, externalAddress, onPressUniqueToken }),
    [additionalData, externalAddress, onPressUniqueToken]
  );

  return (
    <RecyclerAssetListScrollPositionContext.Provider value={position}>
      {type === 'wallet' && <NavbarOverlay accentColor={accentColor} position={position} />}
      <StickyHeaderManager yOffset={navbarHeight + insets.top - 8}>
        <RawMemoRecyclerAssetList
          briefSectionsData={briefSectionsData}
          disablePullDownToRefresh={!!disablePullDownToRefresh}
          extendedState={extendedState}
          onEndReached={onEndReached}
          scrollIndicatorInsets={{
            bottom: insets.bottom + 14,
            top: 132,
          }}
          type={type}
          onViewableItemsChanged={onViewableItemsChanged}
        />
      </StickyHeaderManager>
    </RecyclerAssetListScrollPositionContext.Provider>
  );
}

export default React.memo(RecyclerAssetList);

// //////////////////////////////////////////////////////////

function handlePressQRScanner(): void {
  Navigation.handleAction(Routes.QR_SCANNER_SCREEN);
}

function handlePressMenuItem(route: (typeof Routes)[keyof typeof Routes]): void {
  if (route === Routes.RECEIVE_MODAL) {
    analytics.track(analytics.event.navigationMyQrCode, { category: 'home screen' });
  }
  Navigation.handleAction(route);
}

function handleNavigateToActivity(): void {
  Navigation.handleAction(Routes.PROFILE_SCREEN);
}

const NavbarOverlay = React.memo(function NavbarOverlay({ accentColor, position }: { accentColor?: string; position: RNAnimated.Value }) {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { king_of_the_hill_tab_enabled } = useRemoteConfig('king_of_the_hill_tab_enabled');
  const showKingOfTheHillTab = (useExperimentalFlag(KING_OF_THE_HILL_TAB) || king_of_the_hill_tab_enabled) && !IS_TEST;

  const yOffset = IS_ANDROID ? navbarHeight : insets.top;
  const shadowOpacityStyle = useMemo(
    () => ({
      shadowOpacity: position.interpolate({
        extrapolate: 'clamp',
        inputRange: [yOffset, yOffset, yOffset + 19],
        outputRange: [0, 0, isDarkMode ? 0.2 : 1],
      }),
    }),
    [isDarkMode, position, yOffset]
  );
  const animatedStyle = useMemo(
    () => ({
      opacity: position.interpolate({
        extrapolate: 'clamp',
        inputRange: [yOffset, yOffset, yOffset + 38],
        outputRange: [0, 1, 1],
      }),
      shadowOpacity: position.interpolate({
        extrapolate: 'clamp',
        inputRange: [yOffset, yOffset, yOffset + 19],
        outputRange: [0, 0, isDarkMode ? 0.2 : 0],
      }),
      transform: [
        {
          translateY: position.interpolate({
            extrapolate: 'clamp',
            inputRange: [yOffset, yOffset, yOffset + 38],
            outputRange: [0, 24, 0],
          }),
        },
      ],
    }),
    [isDarkMode, position, yOffset]
  );
  const walletNameStyle = useMemo(
    () => ({
      opacity: position.interpolate({
        extrapolate: 'clamp',
        inputRange: [yOffset, yOffset, yOffset + 38],
        outputRange: [0, 0, 1],
      }),
    }),
    [position, yOffset]
  );

  return (
    <>
      <Box
        as={RNAnimated.View}
        style={[
          {
            top: 0,
            left: 0,
            right: 0,
            shadowColor: isDarkMode ? colors.shadowBlack : colors.rowDividerExtraLight,
            shadowOffset: { width: 0, height: isDarkMode ? 4 : 1 },
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
              height: navbarHeight,
              justifyContent: 'center',
              top: insets.top + 24,
            }}
          />
        </Box>
      </Box>

      <Box
        style={{
          top: navbarHeight + insets.top,
          left: 0,
          right: 0,
          zIndex: 100,
        }}
      >
        <Navbar
          hasStatusBarInset
          leftComponent={
            <Navbar.Item onPress={handlePressQRScanner}>
              <Navbar.TextIcon color={accentColor as string} icon="􀎹" />
            </Navbar.Item>
          }
          rightComponent={
            showKingOfTheHillTab ? (
              <Box flexDirection="row" gap={16}>
                <DropdownMenu testID={'settings-menu'} menuConfig={{ menuItems }} onPressMenuItem={handlePressMenuItem}>
                  <Navbar.TextIcon color={accentColor as string} icon="􀍠" />
                </DropdownMenu>

                <Navbar.Item onPress={handleNavigateToActivity}>
                  <Navbar.TextIcon color={accentColor as string} icon="􀐫" />
                </Navbar.Item>
              </Box>
            ) : (
              <DropdownMenu testID={'settings-menu'} menuConfig={{ menuItems }} onPressMenuItem={handlePressMenuItem}>
                <Navbar.TextIcon color={accentColor as string} icon="􀍠" />
              </DropdownMenu>
            )
          }
          titleComponent={
            <Box
              alignItems="center"
              as={RNAnimated.View}
              height={{ custom: navbarHeight }}
              justifyContent="center"
              style={[walletNameStyle, { alignSelf: 'center', bottom: IS_ANDROID ? 8 : 2 }]}
            >
              <ProfileNameRow variant="header" />
            </Box>
          }
        />
      </Box>
    </>
  );
});
