import * as i18n from '@/languages';
import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import {
  Box,
  DebugLayout,
  Inline,
  Inset,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import { SheetActionButton } from '@/components/sheet';
import { Layout } from '@/components/hardware-wallets/Layout';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { ButtonPressAnimation } from '@/components/animations';
import { TRANSLATIONS } from '@/navigation/PairHardwareWalletNavigator';
import { ImgixImage } from '@/components/images';
import ledgerNano from '@/assets/ledger-nano.png';
import {
  ledgerNanoHeight,
  ledgerNanoWidth,
} from '@/components/hardware-wallets/NanoXDeviceAnimation';
import { Source } from 'react-native-fast-image';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { delay } from '@/helpers/utilities';

const containerConfig = {
  damping: 15,
  mass: 1,
  stiffness: 200,
};
const pulseConfig = {
  damping: 66,
  mass: 1,
  stiffness: 333,
};
const fadeOutConfig = {
  duration: 600,
  easing: Easing.bezierFn(0.76, 0, 0.24, 1),
};

export const ReconnectHardwareWalletSheet = () => {
  const buttonColor = useForegroundColor('purple');
  const indicatorColor = useForegroundColor('green');

  const { navigate } = useNavigation();
  const handleNavigateToSearch = React.useCallback(() => {
    navigate(Routes.PAIR_HARDWARE_WALLET_SEARCH_SHEET);
  }, [navigate]);

  const container = useSharedValue(1);

  const connected = false;

  const indicatorOpacity = useDerivedValue(() =>
    withDelay(
      500,
      withRepeat(
        withSequence(
          withDelay(1000, withTiming(0)),
          withTiming(1),
          withDelay(1000, withTiming(0))
        ),
        -1
      )
    )
  );

  const indicatorAnimation = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
    zIndex: 2,
  }));

  return (
    // <Stack space={{ custom: 379 }}>
    <>
      <Box
        justifyContent="space-between"
        alignItems="center"
        height={{ custom: 580 }}
        paddingTop={{ custom: 55 }}
        paddingBottom="20px"
      >
        <Stack>
          <Inset horizontal="36px">
            <Stack alignHorizontal="center" space="20px">
              <Text align="center" color="label" weight="bold" size="26pt">
                {i18n.t(TRANSLATIONS.pair_your_nano)}
              </Text>
              <Stack space="10px">
                <Text
                  align="center"
                  color="labelTertiary"
                  weight="semibold"
                  size="15pt / 135%"
                >
                  Make sure you have Bluetooth enabled and your Ledger Nano X is
                  unlocked.
                </Text>
              </Stack>
            </Stack>
          </Inset>
          <Box alignItems="center">
            <ImgixImage
              source={ledgerNano as Source}
              style={{
                width: ledgerNanoWidth,
                height: ledgerNanoHeight,
              }}
              size={ledgerNanoHeight}
            />
            <Box
              height={{ custom: 36 }}
              width={{ custom: 149 }}
              borderRadius={18}
              marginTop={{ custom: -60 }}
              background="surfacePrimary"
              shadow="12px"
              alignItems="center"
              justifyContent="center"
            >
              <Inline alignVertical="center" space="8px">
                <Text color="label" weight="semibold" size="17pt">
                  Nano X 7752
                </Text>
                <Box>
                  <Box
                    alignItems="center"
                    as={Animated.View}
                    borderRadius={3.5}
                    height={{ custom: 7 }}
                    justifyContent="center"
                    style={!connected ? [indicatorAnimation] : []}
                    width={{ custom: 7 }}
                  >
                    <Box
                      width={{ custom: 7 }}
                      height={{ custom: 7 }}
                      background="yellow"
                      shadow="30px yellow"
                      position="absolute"
                      borderRadius={3.5}
                    />
                  </Box>
                  <Box
                    width={{ custom: 7 }}
                    height={{ custom: 7 }}
                    background="surfaceSecondary"
                    position="absolute"
                    style={{ zIndex: 1 }}
                    borderRadius={3.5}
                  />
                </Box>
              </Inline>
            </Box>
          </Box>
        </Stack>
        <Inset horizontal="20px">
          <SheetActionButton
            color={buttonColor}
            label={i18n.t(TRANSLATIONS.pair_a_new_ledger)}
            lightShadows
            onPress={handleNavigateToSearch}
            size="big"
            weight="heavy"
          />
        </Inset>
      </Box>
    </>
  );
};
