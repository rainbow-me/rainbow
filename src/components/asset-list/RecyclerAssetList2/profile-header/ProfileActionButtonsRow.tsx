import { ButtonPressAnimation, ButtonPressAnimationProps } from '@/components/animations';
import { CopyFloatingEmojis } from '@/components/floating-emojis';
import { AccentColorProvider, Box, Column, Columns, Inset, Stack, Text, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { getIsDamagedWallet, getIsReadOnlyWallet, useAccountAddress, useIsDamagedWallet } from '@/state/wallets/walletsStore';
import { watchingAlert } from '@/utils';
import { navigateToSwaps } from '@/__swaps__/screens/Swap/navigateToSwaps';
import { analytics } from '@/analytics';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import { useRemoteConfig } from '@/model/remoteConfig';
import * as React from 'react';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import { useRecoilState } from 'recoil';

export const ProfileActionButtonsRowHeight = 80;

export const ProfileActionButtonsRow = React.memo(function ProfileActionButtonsRow() {
  const { accentColor, loaded: accentColorLoaded } = useAccountAccentColor();

  const scale = useDerivedValue(() => (accentColorLoaded ? 1 : 0.9));
  const expandStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(scale.value, {
          damping: 12,
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
});

function ActionButton({
  children,
  icon,
  onPress,
  testID,
}: {
  children: string;
  icon: string;
  onPress?: ButtonPressAnimationProps['onPress'];
  testID?: string;
}) {
  const { colorMode } = useColorMode();
  return (
    <ButtonPressAnimation disabled={!onPress} onPress={onPress} pointerEvents="box-only" scaleTo={0.8} testID={testID}>
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
  const handlePress = React.useCallback(() => {
    if (getIsDamagedWallet()) {
      Navigation.handleAction(Routes.WALLET_ERROR_SHEET);
      return;
    }

    analytics.track(analytics.event.navigationAddCash, { category: 'home screen' });

    Navigation.handleAction(Routes.ADD_CASH_SHEET);
  }, []);

  return (
    <Box>
      <ActionButton icon="􀁌" onPress={handlePress} testID="buy-button">
        {i18n.t(i18n.l.wallet.buy)}
      </ActionButton>
    </Box>
  );
}

function SwapButton() {
  const handlePress = React.useCallback(async () => {
    if (!getIsReadOnlyWallet() || enableActionsOnReadOnlyWallet) {
      analytics.track(analytics.event.navigationSwap, { category: 'home screen' });
      navigateToSwaps();
    } else {
      watchingAlert();
    }
  }, []);

  return (
    <ActionButton icon="􀖅" onPress={handlePress} testID="swap-button">
      {i18n.t(i18n.l.button.swap)}
    </ActionButton>
  );
}

function SendButton() {
  const handlePress = React.useCallback(() => {
    if (!getIsReadOnlyWallet() || enableActionsOnReadOnlyWallet) {
      analytics.track(analytics.event.navigationSend, { category: 'home screen' });

      Navigation.handleAction(Routes.SEND_FLOW);
    } else {
      watchingAlert();
    }
  }, []);

  return (
    <ActionButton icon="􀈟" onPress={handlePress} testID="send-button">
      {i18n.t(i18n.l.button.send)}
    </ActionButton>
  );
}

export function CopyButton() {
  const [isToastActive, setToastActive] = useRecoilState(addressCopiedToastAtom);
  const accountAddress = useAccountAddress();
  const isDamagedWallet = useIsDamagedWallet();

  const handlePressCopy = React.useCallback(() => {
    if (isDamagedWallet) {
      Navigation.handleAction(Routes.WALLET_ERROR_SHEET);
      return;
    }

    if (!isToastActive) {
      setToastActive(true);
      setTimeout(() => {
        setToastActive(false);
      }, 2000);
    }
  }, [isToastActive, setToastActive, isDamagedWallet]);

  return (
    <>
      <CopyFloatingEmojis textToCopy={accountAddress} onPress={handlePressCopy} disabled={isDamagedWallet} testID="receive-button">
        <ActionButton icon="􀐅">{i18n.t(i18n.l.wallet.copy)}</ActionButton>
      </CopyFloatingEmojis>
    </>
  );
}
