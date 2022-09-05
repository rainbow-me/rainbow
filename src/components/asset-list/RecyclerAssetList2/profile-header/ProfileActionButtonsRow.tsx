import Clipboard from '@react-native-community/clipboard';
import lang from 'i18n-js';
// @ts-expect-error - JS module
import { IS_TESTING } from 'react-native-dotenv';
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
import {
  CurrencySelectionTypes,
  ExchangeModalTypes,
  NetworkTypes,
} from '@/helpers';
import {
  useAccountProfile,
  useAccountSettings,
  usePersistentDominantColorFromImage,
  useSwapCurrencyHandlers,
  useWallets,
} from '@/hooks';
import { delayNext } from '@/hooks/useMagicAutofocus';
import { useNavigation } from '@/navigation';
import { useTheme } from '@/theme';
import { watchingAlert } from '@/utils';
import Routes from '@rainbow-me/routes';
import { FloatingEmojis } from '@/components/floating-emojis';
import showWalletErrorAlert from '@/helpers/support';
import { analytics } from '@/analytics';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { useRecoilState } from 'recoil';
import { addressCopiedToastAtom } from '@/screens/WalletScreen';

export const ProfileActionButtonsRowHeight = 80;

export function ProfileActionButtonsRow() {
  // ////////////////////////////////////////////////////
  // Account
  const { accountColor, accountImage } = useAccountProfile();

  // ////////////////////////////////////////////////////
  // Colors

  const { result: dominantColor, state } = usePersistentDominantColorFromImage(
    maybeSignUri(accountImage ?? '') ?? ''
  );

  const { colors } = useTheme();
  let accentColor = colors.white;
  if (accountImage) {
    accentColor = dominantColor || colors.white;
  } else if (typeof accountColor === 'number') {
    accentColor = colors.avatarBackgrounds[accountColor];
  }

  // ////////////////////////////////////////////////////
  // Animations

  const hasAvatarLoaded = !accountImage && accountColor !== undefined;
  const hasImageColorLoaded = state === 2 || state === 3;
  const hasLoaded = hasAvatarLoaded || hasImageColorLoaded;

  const scale = useDerivedValue(() => {
    return hasLoaded ? 1 : 0.9;
  });
  const expandStyle = useAnimatedStyle(() => {
    return {
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
    };
  });

  if (!hasLoaded) return null;
  return (
    <Box width="full">
      <Inset horizontal={{ custom: 17 }}>
        <AccentColorProvider color={accentColor}>
          <Columns>
            <Column>
              <Animated.View style={[expandStyle]}>
                <CopyButton />
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
                  offset: { x: 0, y: 8 },
                  blur: 24,
                  opacity: 0.3,
                  color: colorMode === 'dark' ? 'shadow' : 'accent',
                },
                {
                  offset: { x: 0, y: 2 },
                  blur: 6,
                  opacity: 0.04,
                  color: 'shadow',
                },
              ],
              android: {
                elevation: 21,
                opacity: 1,
                color: colorMode === 'dark' ? 'shadow' : 'accent',
              },
            },
          }}
          width={{ custom: 60 }}
        >
          <Text align="center" size="icon 23px" weight="bold">
            {icon}
          </Text>
        </Box>
        <Text color="secondary80" size="14px" weight="medium">
          {children}
        </Text>
      </Stack>
    </ButtonPressAnimation>
  );
}

function CopyButton() {
  const { accountAddress } = useAccountProfile();

  const [isToastActive, setToastActive] = useRecoilState(
    addressCopiedToastAtom
  );

  const onNewEmoji = React.useRef<() => void>();

  const { isDamaged } = useWallets();

  const handlePress = React.useCallback(() => {
    if (isDamaged) showWalletErrorAlert();

    analytics.track('Tapped "Copy"', {
      category: 'home screen',
    });

    let timeout: NodeJS.Timeout;
    if (!isToastActive) {
      setToastActive(true);
      timeout = setTimeout(() => {
        setToastActive(false);
      }, 2000);
    }

    onNewEmoji?.current && onNewEmoji.current();
    Clipboard.setString(accountAddress);

    return () => clearTimeout(timeout);
  }, [accountAddress, isDamaged, isToastActive, setToastActive]);

  return (
    <Box>
      {/* @ts-expect-error – JS component */}
      <FloatingEmojis
        distance={150}
        duration={500}
        fadeOut={false}
        scaleTo={0}
        size={50}
        wiggleFactor={0}
        // @ts-expect-error – JS component
        setOnNewEmoji={newOnNewEmoji => (onNewEmoji.current = newOnNewEmoji)}
      />
      <ActionButton icon="􀐅" onPress={handlePress} testID="copy-button">
        {lang.t('wallet.copy')}
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

  const { accountAddress } = useAccountProfile();
  const { navigate } = useNavigation();
  const { isDamaged } = useWallets();

  const handlePressAddCash = React.useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
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

  const handlePressQRCode = React.useCallback(() => {
    analytics.track('Tapped "My QR Code"', {
      category: 'home screen',
    });

    navigate(Routes.RECEIVE_MODAL);
  }, [navigate]);

  // ////////////////////////////////////////////////////
  // Context Menu

  const { network } = useAccountSettings();

  const isAddCashAvailable =
    IS_TESTING === 'true' || network === NetworkTypes.mainnet;

  const menuConfig = React.useMemo(
    () => ({
      menuItems: [
        isAddCashAvailable
          ? {
              actionKey: 'addCash',
              actionTitle: lang.t('button.add_cash'),
              icon: { iconType: 'SYSTEM', iconValue: 'dollarsign.circle' },
            }
          : null,
        {
          actionKey: 'qrCode',
          actionTitle: lang.t('button.my_qr_code'),
          icon: { iconType: 'SYSTEM', iconValue: 'qrcode' },
        },
      ].filter(x => x),
      ...(ios ? { menuTitle: '' } : {}),
    }),
    [isAddCashAvailable]
  );

  const handlePressMenuItem = React.useCallback(
    e => {
      if (e.nativeEvent.actionKey === 'addCash') {
        handlePressAddCash();
      }
      if (e.nativeEvent.actionKey === 'qrCode') {
        handlePressQRCode();
      }
    },
    [handlePressAddCash, handlePressQRCode]
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
