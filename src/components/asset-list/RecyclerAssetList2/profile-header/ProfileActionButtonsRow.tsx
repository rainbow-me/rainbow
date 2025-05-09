import Clipboard from '@react-native-clipboard/clipboard';
import * as lang from '@/languages';
import * as React from 'react';
import { PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { CopyFloatingEmojis } from '@/components/floating-emojis';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { AccentColorProvider, Box, Column, Columns, Inset, Stack, Text, useColorMode } from '@/design-system';
import { useAccountProfile, useWallets } from '@/hooks';
import Navigation from '@/navigation/Navigation';
import { watchingAlert } from '@/utils';
import Routes from '@rainbow-me/routes';
import showWalletErrorAlert from '@/helpers/support';
import { analytics } from '@/analytics';
import { useRecoilState } from 'recoil';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { navigateToSwaps } from '@/__swaps__/screens/Swap/navigateToSwaps';

export const ProfileActionButtonsRowHeight = 80;

export function ProfileActionButtonsRow() {
  const { accentColor, loaded: accentColorLoaded } = useAccountAccentColor();

  const scale = useDerivedValue(() => (accentColorLoaded ? 1 : 0.9));
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

  const { f2c_enabled: addCashEnabled, swagg_enabled: swapEnabled } = useRemoteConfig();

  if (!accentColorLoaded) return null;

  return (
    <Box width="full">
      <Inset horizontal={{ custom: 17 }}>
        <AccentColorProvider color={accentColor}>
          <Columns>
            {addCashEnabled && (
              <Column>
                <Animated.View style={[expandStyle]}>
                  <BuyButton />
                </Animated.View>
              </Column>
            )}
            {swapEnabled && (
              <Column>
                <Animated.View style={[expandStyle]}>
                  <SwapButton />
                </Animated.View>
              </Column>
            )}
            <Column>
              <Animated.View style={[expandStyle]}>
                <SendButton />
              </Animated.View>
            </Column>
            <Column>
              <Animated.View style={[expandStyle]}>
                <CopyButton />
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
    <ButtonPressAnimation onPress={onPress} pointerEvents="box-only" scale={0.8} testID={testID}>
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
        <Text color="secondary80 (Deprecated)" size="14px / 19px (Deprecated)" weight="medium">
          {children}
        </Text>
      </Stack>
    </ButtonPressAnimation>
  );
}

function BuyButton() {
  const { isDamaged } = useWallets();

  const handlePress = React.useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    analytics.track(analytics.event.navigationAddCash, { category: 'home screen' });

    Navigation.handleAction(Routes.ADD_CASH_SHEET);
  }, [isDamaged]);

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

  const handlePress = React.useCallback(async () => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      analytics.track(analytics.event.navigationSwap, { category: 'home screen' });
      navigateToSwaps();
    } else {
      watchingAlert();
    }
  }, [isReadOnlyWallet]);

  return (
    <ActionButton icon="􀖅" onPress={handlePress} testID="swap-button">
      {lang.t('button.swap')}
    </ActionButton>
  );
}

function SendButton() {
  const { isReadOnlyWallet } = useWallets();

  const handlePress = React.useCallback(() => {
    if (!isReadOnlyWallet || enableActionsOnReadOnlyWallet) {
      analytics.track(analytics.event.navigationSend, { category: 'home screen' });

      Navigation.handleAction(Routes.SEND_FLOW);
    } else {
      watchingAlert();
    }
  }, [isReadOnlyWallet]);

  return (
    <ActionButton icon="􀈟" onPress={handlePress} testID="send-button">
      {lang.t('button.send')}
    </ActionButton>
  );
}

export function CopyButton() {
  const [isToastActive, setToastActive] = useRecoilState(addressCopiedToastAtom);
  const { accountAddress } = useAccountProfile();
  const { isDamaged } = useWallets();

  const handlePressCopy = React.useCallback(() => {
    if (isDamaged) {
      showWalletErrorAlert();
      return;
    }

    if (!isToastActive) {
      setToastActive(true);
      setTimeout(() => {
        setToastActive(false);
      }, 2000);
    }
    Clipboard.setString(accountAddress);
  }, [accountAddress, isDamaged, isToastActive, setToastActive]);

  return (
    <>
      <CopyFloatingEmojis textToCopy={accountAddress}>
        <ActionButton onPress={handlePressCopy} icon="􀐅" testID="receive-button">
          {lang.t('wallet.copy')}
        </ActionButton>
      </CopyFloatingEmojis>
    </>
  );
}
