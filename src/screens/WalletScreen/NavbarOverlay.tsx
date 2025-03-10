import React from 'react';
import Animated, { interpolate, interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
import { Box, useBackgroundColor } from '@/design-system';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { useTheme } from '@/theme';
import { analytics } from '@/analytics';
import * as lang from '@/languages';
import { useAccountAccentColor } from '@/hooks';
import { DropdownMenu } from '@/components/DropdownMenu';
import { useScrollPosition } from './ScrollPositionContext';
import { ProfileName } from './ProfileName';

const SETTINGS_MENU_ITEMS = {
  settings: {
    actionKey: 'settings',
    actionTitle: lang.t(lang.l.settings.label),
    icon: { iconType: 'SYSTEM', iconValue: 'gear' },
    route: Routes.SETTINGS_SHEET,
  },
  qrCode: {
    actionKey: 'qrCode',
    actionTitle: lang.t(lang.l.button.my_qr_code),
    icon: { iconType: 'SYSTEM', iconValue: 'qrcode' },
    route: Routes.RECEIVE_MODAL,
  },
  connectedApps: {
    actionKey: 'connectedApps',
    actionTitle: lang.t(lang.l.wallet.connected_apps),
    icon: { iconType: 'SYSTEM', iconValue: 'app.badge.checkmark' },
    route: Routes.CONNECTED_DAPPS,
  },
} as const;

export function NavbarOverlay() {
  const { position } = useScrollPosition();
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const bgColor = useBackgroundColor('surfacePrimary');
  const { highContrastAccentColor } = useAccountAccentColor();

  const yOffset = insets.top + 16;
  const shadowOpacityStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: interpolate(position.value, [0, yOffset, yOffset + 19], [0, 0, isDarkMode ? 0.2 : 1], 'clamp'),
    };
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(position.value, [0, yOffset, yOffset + 16], [colors.transparent, colors.transparent, bgColor]),
      opacity: interpolate(position.value, [0, yOffset, yOffset + 38], [0, 1, 1], 'clamp'),
      shadowOpacity: interpolate(position.value, [0, yOffset, yOffset + 19], [0, 0, isDarkMode ? 0.2 : 0], 'clamp'),
      transform: [
        {
          translateY: interpolate(position.value, [0, yOffset, yOffset + 38], [0, 24, 0], 'clamp'),
        },
      ],
    };
  });

  const walletNameStyle = useAnimatedStyle(() => {
    const opacity = interpolate(position.value, [0, yOffset, yOffset + 38], [0, 0, 1], 'clamp');
    return {
      pointerEvents: opacity > 0.5 ? 'auto' : 'none',
      opacity,
    };
  });

  const handlePressMenuItem = React.useCallback(
    (e: keyof typeof SETTINGS_MENU_ITEMS) => {
      if (e === 'qrCode') {
        analytics.track('Tapped "My QR Code"', {
          category: 'home screen',
        });
      }
      navigate(SETTINGS_MENU_ITEMS[e].route);
    },
    [navigate]
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
        alignItems="center"
        justifyContent="center"
        style={[
          {
            height: navbarHeight + insets.top + 24,
            width: '100%',
            position: 'absolute',
            shadowColor: colors.shadowBlack,
            shadowOffset: { width: 0, height: 1 },
            shadowRadius: 3,
            top: navbarHeight + insets.top - 24,
            paddingTop: insets.top + 24,
          },
          animatedStyle,
        ]}
      />
      <Box style={{ top: navbarHeight + insets.top, zIndex: 100 }}>
        <Navbar
          hasStatusBarInset
          leftComponent={
            <Navbar.Item onPress={() => handlePressMenuItem('qrCode')}>
              <Navbar.TextIcon color={highContrastAccentColor} icon="􀎹" />
            </Navbar.Item>
          }
          rightComponent={
            <DropdownMenu menuConfig={{ menuItems: Object.values(SETTINGS_MENU_ITEMS) }} onPressMenuItem={handlePressMenuItem}>
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
              <ProfileName />
            </Box>
          }
        />
      </Box>
    </Animated.View>
  );
}
