import React, { useMemo } from 'react';
import { Animated as RNAnimated, View } from 'react-native';
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
import AndroidContextMenu from '@/components/context-menu/ContextMenu.android';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { analytics } from '@/analytics';
import useWalletConnectConnections from '@/hooks/useWalletConnectConnections';
import lang from 'i18n-js';
import { useWalletConnectV2Sessions } from '@/walletConnect/hooks/useWalletConnectV2Sessions';
import { IS_ANDROID } from '@/env';

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
  const { memoizedResult: briefSectionsData, additionalData } = useMemoBriefSectionData({
    briefSectionsData: walletBriefSectionsData,
    externalAddress,
    type,
  });

  const insets = useSafeAreaInsets();

  const position = useMemoOne(() => new RNAnimated.Value(type === 'wallet' ? -insets.top : 0), []);

  const extendedState = useMemo(
    () => ({ additionalData, externalAddress, onPressUniqueToken }),
    [additionalData, externalAddress, onPressUniqueToken]
  );

  return (
    <RecyclerAssetListScrollPositionContext.Provider value={position}>
      {type === 'wallet' && <NavbarOverlay accentColor={accentColor} position={position} />}
      <StickyHeaderManager yOffset={ios ? navbarHeight + insets.top - 8 : 100}>
        <RawMemoRecyclerAssetList
          briefSectionsData={briefSectionsData}
          disablePullDownToRefresh={!!disablePullDownToRefresh}
          extendedState={extendedState}
          scrollIndicatorInsets={{
            bottom: insets.bottom + 14,
            top: 132,
          }}
          type={type}
        />
      </StickyHeaderManager>
    </RecyclerAssetListScrollPositionContext.Provider>
  );
}

export default React.memo(RecyclerAssetList);

// //////////////////////////////////////////////////////////

function NavbarOverlay({ accentColor, position }: { accentColor?: string; position: RNAnimated.Value }) {
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const handlePressQRCode = React.useCallback(() => {
    analytics.track('Tapped "My QR Code"', {
      category: 'home screen',
    });

    navigate(Routes.RECEIVE_MODAL);
  }, [navigate]);

  const handlePressConnectedApps = React.useCallback(() => {
    navigate(Routes.CONNECTED_DAPPS);
  }, [navigate]);

  const handlePressQRScanner = React.useCallback(() => {
    navigate(Routes.QR_SCANNER_SCREEN);
  }, [navigate]);

  const handlePressSettings = React.useCallback(() => {
    navigate(Routes.SETTINGS_SHEET);
  }, [navigate]);

  const yOffset = IS_ANDROID ? 80 : 0;
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
        outputRange: [0, 0, 1],
      }),
    }),
    [position, yOffset]
  );

  // ////////////////////////////////////////////////////
  // Context Menu
  const { mostRecentWalletConnectors } = useWalletConnectConnections();
  const { sessions: activeWCV2Sessions } = useWalletConnectV2Sessions();

  const menuConfig = React.useMemo(
    () => ({
      menuItems: [
        {
          actionKey: 'settings',
          actionTitle: lang.t('settings.label'),
          icon: { iconType: 'SYSTEM', iconValue: 'gear' },
        },
        {
          actionKey: 'qrCode',
          actionTitle: lang.t('button.my_qr_code'),
          icon: { iconType: 'SYSTEM', iconValue: 'qrcode' },
        },

        {
          actionKey: 'connectedApps',
          actionTitle: lang.t('wallet.connected_apps'),
          icon: { iconType: 'SYSTEM', iconValue: 'app.badge.checkmark' },
        },
      ].filter(Boolean),
      ...(ios ? { menuTitle: '' } : {}),
    }),
    [activeWCV2Sessions.length, mostRecentWalletConnectors.length]
  );

  const handlePressMenuItem = React.useCallback(
    (e: any) => {
      if (e.nativeEvent.actionKey === 'settings') {
        handlePressSettings();
      }
      if (e.nativeEvent.actionKey === 'qrCode') {
        handlePressQRCode();
      }
      if (e.nativeEvent.actionKey === 'connectedApps') {
        handlePressConnectedApps();
      }
    },
    [handlePressConnectedApps, handlePressQRCode, handlePressSettings]
  );

  return (
    <Box
      as={RNAnimated.View}
      style={[
        {
          shadowColor: isDarkMode ? colors.shadowBlack : colors.rowDividerExtraLight,
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
            height: navbarHeight,
            justifyContent: 'center',
            top: insets.top + 24,
          }}
        />
      </Box>
      <Box style={{ top: navbarHeight + insets.top, zIndex: 100 }}>
        <Navbar
          hasStatusBarInset
          leftComponent={
            <Navbar.Item onPress={handlePressQRScanner}>
              <Navbar.TextIcon color={accentColor as string} icon="􀎹" />
            </Navbar.Item>
          }
          rightComponent={
            IS_ANDROID ? (
              <AndroidContextMenu
                dynamicOptions={undefined}
                options={menuConfig.menuItems.map(item => item?.actionTitle)}
                cancelButtonIndex={menuConfig.menuItems.length - 1}
                onPressActionSheet={(buttonIndex: number) => {
                  handlePressMenuItem({ nativeEvent: { actionKey: menuConfig.menuItems[buttonIndex]?.actionKey } });
                }}
              >
                <View>
                  <Navbar.Item>
                    <Navbar.TextIcon color={accentColor as string} icon="􀍠" />
                  </Navbar.Item>
                </View>
              </AndroidContextMenu>
            ) : (
              <ContextMenuButton menuConfig={menuConfig} onPressMenuItem={handlePressMenuItem}>
                <Navbar.Item>
                  <Navbar.TextIcon color={accentColor as string} icon="􀍠" />
                </Navbar.Item>
              </ContextMenuButton>
            )
          }
          titleComponent={
            <Box
              alignItems="center"
              as={RNAnimated.View}
              height={{ custom: navbarHeight }}
              justifyContent="center"
              style={[walletNameStyle, { alignSelf: 'center', bottom: 2, zIndex: -1 }]}
            >
              <ProfileNameRow variant="header" />
            </Box>
          }
        />
      </Box>
    </Box>
  );
}
