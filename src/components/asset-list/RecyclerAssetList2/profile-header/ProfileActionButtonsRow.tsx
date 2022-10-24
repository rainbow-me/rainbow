import Clipboard from '@react-native-community/clipboard';
import lang from 'i18n-js';
import * as React from 'react';
import { PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { enableActionsOnReadOnlyWallet } from '@/config';
import {
  AccentColorProvider,
  Box,
  Column,
  Columns,
  Inset,
  Stack,
  Text,
  useColorMode,
} from '@/design-system';
import { maybeSignUri } from '@/handlers/imgix';
import { CurrencySelectionTypes, ExchangeModalTypes } from '@/helpers';
import {
  useAccountProfile,
  usePersistentDominantColorFromImage,
  useSwapCurrencyHandlers,
  useWalletConnectConnections,
  useWallets,
} from '@/hooks';
import { delayNext } from '@/hooks/useMagicAutofocus';
import { useNavigation } from '@/navigation';
import { useTheme } from '@/theme';
import { watchingAlert } from '@/utils';
import Routes from '@rainbow-me/routes';
import showWalletErrorAlert from '@/helpers/support';
import { analytics } from '@/analytics';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { useRecoilState } from 'recoil';
import { addressCopiedToastAtom } from '@/screens/WalletScreen';
import config from '@/model/config';

export const ProfileActionButtonsRowHeight = 80;

export function ProfileActionButtonsRow() {
  // ////////////////////////////////////////////////////
  // Account
  const { accountColor, accountImage, accountSymbol } = useAccountProfile();

  // ////////////////////////////////////////////////////
  // Colors

  const { result: dominantColor, state } = usePersistentDominantColorFromImage(
    maybeSignUri(accountImage ?? '') ?? ''
  );

  const { colors } = useTheme();
  let accentColor = colors.appleBlue;
  if (accountImage) {
    accentColor = dominantColor || colors.appleBlue;
  } else if (typeof accountColor === 'number') {
    accentColor = colors.avatarBackgrounds[accountColor];
  } else if (typeof accountColor === 'string') {
    accentColor = accountColor;
  }

  // ////////////////////////////////////////////////////
  // Animations

  const hasAvatarLoaded = !!accountImage || accountSymbol;
  const hasImageColorLoaded = state === 2 || state === 3;
  const hasLoaded = hasAvatarLoaded || hasImageColorLoaded;

  const scale = useDerivedValue(() => (hasLoaded ? 1 : 0.9));
  const expandStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(scale.value, {
          damping: 12,
          restDisplacementThreshold: 0.001,
          restSpeedThreshold: 0.001,
          stiffness: 280,
        }),
      },
    ],
  }));

  if (!hasLoaded) return null;
  return (
    <Box width="full">
      <Inset horizontal={{ custom: 17 }}>
        <AccentColorProvider color={accentColor}>
          <Columns>
            <Column>
              <Animated.View style={[expandStyle]}>
                <BuyButton />
              </Animated.View>
            </Column>
            <Column>
              <Animated.View style={[expandStyle]}>
                <SwapButton />
              </Animated.View>
            </Column>
            <Column>
              <Animated.View style={[expandStyle]}>
                <SendButton />
              </Animated.View>
            </Column>
            <Column>
              <Animated.View style={[expandStyle]}>
                <MoreButton />
              </Animated.View>
            </Column>
          </Columns>
        </AccentColorProvider>
      </Inset>
    </Box>
  );
}

function ActionButton({
  children,
  icon,
  onPress,
  testID,
}: {
  children: string;
  icon: string;
  onPress?: PressableProps['onPress'];
  testID?: string;
}) {
  const { colorMode } = useColorMode();
  return (
    <ButtonPressAnimation onPress={onPress} scale={0.8} testID={testID}>
      <Stack alignHorizontal="center" space="10px">
        <Box
          alignItems="center"
          background="accent"
          borderRadius={60}
          height={{ custom: 60 }}
          justifyContent="center"
          shadow={{
            custom: {
              ios: [
                {
                  x: 0,
                  y: 8,
                  blur: 24,
                  opacity: 0.3,
                  color: colorMode === 'dark' ? 'shadowFar' : 'accent',
                },
                {
                  x: 0,
                  y: 2,
                  blur: 6,
                  opacity: 0.04,
                  color: 'shadowFar',
                },
              ],
              android: {
                elevation: 21,
                opacity: 1,
                color: colorMode === 'dark' ? 'shadowFar' : 'accent',
              },
            },
          }}
          width={{ custom: 60 }}
        >
          <Text align="center" color="label" size="icon 23px" weight="bold">
            {icon}
          </Text>
        </Box>
        <Text
          color="secondary80 (Deprecated)"
          size="14px / 19px (Deprecated)"
          weight="medium"
        >
          {children}
        </Text>
      </Stack>
    </ButtonPressAnimation>
  );
}

function BuyButton() {
  const { accountAddress } = useAccountProfile();
  const { navigate } = useNavigation();
  const { isDamaged } = useWallets();

  const handlePress = React.useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    if (!config.wyre_enabled) {
      navigate(Routes.EXPLAIN_SHEET, { type: 'wyre_degradation' });
      return;
    }

    analytics.track('Tapped "Add Cash"', {
      category: 'home screen',
    });

    if (ios) {
      navigate(Routes.ADD_CASH_FLOW);
    } else {
      navigate(Routes.WYRE_WEBVIEW_NAVIGATOR, {
        params: {
          address: accountAddress,
        },
        screen: Routes.WYRE_WEBVIEW,
      });
    }
  }, [accountAddress, isDamaged, navigate]);

  return (
    <Box>
      <ActionButton icon="􀁌" onPress={handlePress} testID="buy-button">
        {lang.t('wallet.buy')}
      </ActionButton>
    </Box>
  );
}

function SwapButton() {
  const { isReadOnlyWallet } = useWallets();

  const { navigate } = useNavigation();

  const { updateInputCurrency } = useSwapCurrencyHandlers({
    shouldUpdate: false,
    type: ExchangeModalTypes.swap,
  });

  const handlePress = React.useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      analytics.track('Tapped "Swap"', {
        category: 'home screen',
      });

      android && delayNext();
      navigate(Routes.EXCHANGE_MODAL, {
        fromDiscover: true,
        params: {
          fromDiscover: true,
          onSelectCurrency: updateInputCurrency,
          title: lang.t('swap.modal_types.swap'),
          type: CurrencySelectionTypes.input,
        },
        screen: Routes.CURRENCY_SELECT_SCREEN,
      });
    } else {
      watchingAlert();
    }
  }, [isReadOnlyWallet, navigate, updateInputCurrency]);

  return (
    <ActionButton icon="􀖅" onPress={handlePress} testID="swap-button">
      {lang.t('button.swap')}
    </ActionButton>
  );
}

function SendButton() {
  const { isReadOnlyWallet } = useWallets();

  const { navigate } = useNavigation();

  const handlePress = React.useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      analytics.track('Tapped "Send"', {
        category: 'home screen',
      });

      navigate(Routes.SEND_FLOW);
    } else {
      watchingAlert();
    }
  }, [navigate, isReadOnlyWallet]);

  return (
    <ActionButton icon="􀈟" onPress={handlePress} testID="send-button">
      {lang.t('button.send')}
    </ActionButton>
  );
}

function MoreButton() {
  // ////////////////////////////////////////////////////
  // Handlers

  const [isToastActive, setToastActive] = useRecoilState(
    addressCopiedToastAtom
  );
  const { accountAddress } = useAccountProfile();
  const { navigate } = useNavigation();

  const handlePressCopy = React.useCallback(() => {
    if (!isToastActive) {
      setToastActive(true);
      setTimeout(() => {
        setToastActive(false);
      }, 2000);
    }
    Clipboard.setString(accountAddress);
  }, [accountAddress, isToastActive, setToastActive]);

  const handlePressQRCode = React.useCallback(() => {
    analytics.track('Tapped "My QR Code"', {
      category: 'home screen',
    });

    navigate(Routes.RECEIVE_MODAL);
  }, [navigate]);

  const handlePressConnectedApps = React.useCallback(() => {
    navigate(Routes.CONNECTED_DAPPS);
  }, [navigate]);

  // ////////////////////////////////////////////////////
  // Context Menu

  const { mostRecentWalletConnectors } = useWalletConnectConnections();

  const menuConfig = React.useMemo(
    () => ({
      menuItems: [
        {
          actionKey: 'copy',
          actionTitle: lang.t('wallet.copy_address'),
          icon: { iconType: 'SYSTEM', iconValue: 'doc.on.doc' },
        },
        {
          actionKey: 'qrCode',
          actionTitle: lang.t('button.my_qr_code'),
          icon: { iconType: 'SYSTEM', iconValue: 'qrcode' },
        },
        mostRecentWalletConnectors.length > 0
          ? {
              actionKey: 'connectedApps',
              actionTitle: lang.t('wallet.connected_apps'),
              icon: { iconType: 'SYSTEM', iconValue: 'app.badge.checkmark' },
            }
          : null,
      ].filter(Boolean),
      ...(ios ? { menuTitle: '' } : {}),
    }),
    [mostRecentWalletConnectors.length]
  );

  const handlePressMenuItem = React.useCallback(
    e => {
      if (e.nativeEvent.actionKey === 'copy') {
        handlePressCopy();
      }
      if (e.nativeEvent.actionKey === 'qrCode') {
        handlePressQRCode();
      }
      if (e.nativeEvent.actionKey === 'connectedApps') {
        handlePressConnectedApps();
      }
    },
    [handlePressConnectedApps, handlePressCopy, handlePressQRCode]
  );

  return (
    <ContextMenuButton
      menuConfig={menuConfig}
      onPressMenuItem={handlePressMenuItem}
    >
      <ActionButton icon="􀍡" testID="more-button">
        {lang.t('button.more')}
      </ActionButton>
    </ContextMenuButton>
  );
}
