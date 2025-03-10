import React from 'react';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
import { Box } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { ProfileNameRow } from '@/components/asset-list/RecyclerAssetList2/profile-header/ProfileNameRow';
import { analytics } from '@/analytics';
import * as lang from '@/languages';
import { IS_ANDROID } from '@/env';
import { useAccountAccentColor } from '@/hooks';
import { DropdownMenu, MenuItem } from '@/components/DropdownMenu';
import { useScrollPosition } from './ScrollPositionContext';

export function NavbarOverlay() {
  const { position } = useScrollPosition();
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const { highContrastAccentColor } = useAccountAccentColor();

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
  const shadowOpacityStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(position.value, [0, yOffset, yOffset + 19], [0, 0, isDarkMode ? 0.2 : 1]),
  }));

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(position.value, [0, yOffset, yOffset + 38], [0, 1, 1]),
    shadowOpacity: interpolate(position.value, [0, yOffset, yOffset + 19], [0, 0, isDarkMode ? 0.2 : 0]),
    transform: [
      {
        translateY: interpolate(position.value, [0, yOffset, yOffset + 38], [0, 24, 0]),
      },
    ],
  }));

  const walletNameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(position.value, [0, yOffset, yOffset + 38], [0, 0, 1]),
  }));

  const menuItems: MenuItem<string>[] = React.useMemo(
    () => [
      {
        actionKey: 'settings',
        actionTitle: lang.t(lang.l.settings.label),
        icon: { iconType: 'SYSTEM', iconValue: 'gear' },
      },
      {
        actionKey: 'qrCode',
        actionTitle: lang.t(lang.l.button.my_qr_code),
        icon: { iconType: 'SYSTEM', iconValue: 'qrcode' },
      },

      {
        actionKey: 'connectedApps',
        actionTitle: lang.t(lang.l.wallet.connected_apps),
        icon: { iconType: 'SYSTEM', iconValue: 'app.badge.checkmark' },
      },
    ],
    []
  );

  const handlePressMenuItem = React.useCallback(
    (e: string) => {
      if (e === 'settings') {
        handlePressSettings();
      }
      if (e === 'qrCode') {
        handlePressQRCode();
      }
      if (e === 'connectedApps') {
        handlePressConnectedApps();
      }
    },
    [handlePressConnectedApps, handlePressQRCode, handlePressSettings]
  );

  return (
    <Animated.View
      style={[
        {
          shadowColor: isDarkMode ? colors.shadowBlack : colors.rowDividerExtraLight,
          shadowOffset: { width: 0, height: isDarkMode ? 4 : 1 },
          shadowRadius: isDarkMode ? 20 : 0,
          zIndex: 1,
        },
        shadowOpacityStyle,
      ]}
    >
      <Box
        as={Animated.View}
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
      <Box style={{ top: navbarHeight + insets.top, zIndex: 100 }}>
        <Navbar
          hasStatusBarInset
          leftComponent={
            <Navbar.Item onPress={handlePressQRScanner}>
              <Navbar.TextIcon color={highContrastAccentColor} icon="􀎹" />
            </Navbar.Item>
          }
          rightComponent={
            <DropdownMenu menuConfig={{ menuItems }} onPressMenuItem={handlePressMenuItem}>
              <Navbar.Item testID={'settings-menu'}>
                <Navbar.TextIcon color={highContrastAccentColor} icon="􀍠" />
              </Navbar.Item>
            </DropdownMenu>
          }
          titleComponent={
            <Box
              alignItems="center"
              as={Animated.View}
              height={{ custom: navbarHeight }}
              justifyContent="center"
              style={[walletNameStyle, { alignSelf: 'center', bottom: 2 }]}
            >
              <ProfileNameRow variant="header" />
            </Box>
          }
        />
      </Box>
    </Animated.View>
  );
}
