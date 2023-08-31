import * as i18n from '@/languages';
import React, { useCallback } from 'react';
import { Box, Inline, Inset, Stack, Text } from '@/design-system';
import { ImgixImage } from '@/components/images';
import ledgerNano from '@/assets/ledger-nano.png';
import {
  LEDGER_NANO_HEIGHT,
  LEDGER_NANO_WIDTH,
  GRID_DOTS_SIZE,
} from '@/screens/hardware-wallets/components/NanoXDeviceAnimation';
import { Source } from 'react-native-fast-image';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import gridDotsLight from '@/assets/dot-grid-light.png';
import gridDotsDark from '@/assets/dot-grid-dark.png';
import { useTheme } from '@/theme';
import { IS_IOS } from '@/env';
import { TRANSLATIONS } from '@/screens/hardware-wallets/constants';
import { useRecoilState, useSetRecoilState } from 'recoil';
import {
  HARDWARE_TX_ERROR_KEY,
  HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT,
  LedgerIsReadyAtom,
  ledgerStorage,
  readyForPollingAtom,
  triggerPollerCleanupAtom,
} from '@/navigation/HardwareWalletTxNavigator';
import { TryAgainButton } from './components/TryAgainButton';
import { useMMKVBoolean } from 'react-native-mmkv';
import { ImageBackground } from 'react-native';

const INDICATOR_SIZE = 9;

export const PairHardwareWalletAgainSheet = () => {
  const { isDarkMode } = useTheme();

  const [isReady, setIsReady] = useRecoilState(LedgerIsReadyAtom);
  const setReadyForPolling = useSetRecoilState(readyForPollingAtom);
  const setTriggerPollerCleanup = useSetRecoilState(triggerPollerCleanupAtom);

  const [hardwareTXError, setHardwareTXError] = useMMKVBoolean(
    HARDWARE_TX_ERROR_KEY,
    ledgerStorage
  );

  const onPressTryAgain = useCallback(() => {
    setTriggerPollerCleanup(true);
    setHardwareTXError(false);
    setReadyForPolling(true);
    setIsReady(false);
  }, [
    setTriggerPollerCleanup,
    setHardwareTXError,
    setReadyForPolling,
    setIsReady,
  ]);

  const indicatorOpacity = useDerivedValue(() =>
    withRepeat(
      withSequence(
        withDelay(1000, withTiming(0)),
        withDelay(1000, withTiming(1))
      ),
      -1
    )
  );

  const indicatorAnimation = useAnimatedStyle(() => ({
    opacity: indicatorOpacity.value,
  }));

  const getSheetTitle = useCallback(() => {
    if (hardwareTXError) {
      return i18n.t(TRANSLATIONS.transaction_rejected);
    } else if (isReady) {
      return i18n.t(TRANSLATIONS.confirm_on_device);
    } else {
      return i18n.t(TRANSLATIONS.looking_for_devices);
    }
  }, [hardwareTXError, isReady]);

  const getSheetSubtitle = useCallback(() => {
    if (hardwareTXError) {
      return i18n.t(TRANSLATIONS.please_try_again);
    } else if (isReady) {
      return i18n.t(TRANSLATIONS.connected_and_ready);
    } else {
      return i18n.t(TRANSLATIONS.make_sure_bluetooth_enabled);
    }
  }, [hardwareTXError, isReady]);

  return (
    <>
      <Box
        height={{ custom: HARDWARE_WALLET_TX_NAVIGATOR_SHEET_HEIGHT }}
        width="full"
        justifyContent="space-between"
        alignItems="center"
        paddingTop={{ custom: 55 }}
        paddingBottom={{ custom: 54 }}
      >
        <Box style={{ zIndex: 1 }}>
          <Inset horizontal="36px">
            <Stack alignHorizontal="center" space="20px">
              <Text align="center" color="label" weight="bold" size="26pt">
                {getSheetTitle()}
              </Text>
              <Stack space="10px">
                <Text
                  align="center"
                  color="labelTertiary"
                  weight="semibold"
                  size="15pt / 135%"
                >
                  {getSheetSubtitle()}
                </Text>
              </Stack>
            </Stack>
          </Inset>
        </Box>
        <Box marginTop={{ custom: -70 }} style={{ zIndex: -99 }}>
          <ImageBackground
            source={isDarkMode ? gridDotsDark : gridDotsLight}
            style={{
              width: GRID_DOTS_SIZE,
              height: GRID_DOTS_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ImageBackground
              source={ledgerNano}
              style={{
                width: LEDGER_NANO_WIDTH,
                height: LEDGER_NANO_HEIGHT,
                alignItems: 'center',
              }}
            >
              <Box
                height={{ custom: 36 }}
                top={{ custom: LEDGER_NANO_HEIGHT / 2 + 80 }}
                paddingHorizontal="12px"
                borderRadius={18}
                background="surfaceSecondaryElevated"
                shadow="12px"
                alignItems="center"
                justifyContent="center"
              >
                <Inline alignVertical="center" space="8px">
                  <Text color="label" weight="semibold" size="17pt">
                    Nano X
                  </Text>
                  <Box>
                    {!isReady && (
                      <Animated.View
                        style={{
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: INDICATOR_SIZE,
                          width: INDICATOR_SIZE,
                          borderRadius: INDICATOR_SIZE / 2,
                          ...(!isReady ? indicatorAnimation : {}),
                        }}
                      >
                        <Box
                          width={{ custom: INDICATOR_SIZE }}
                          height={{ custom: INDICATOR_SIZE }}
                          background="yellow"
                          shadow={IS_IOS ? '30px yellow' : undefined}
                          position="absolute"
                          borderRadius={INDICATOR_SIZE / 2}
                        />
                      </Animated.View>
                    )}
                    <Box
                      width={{ custom: INDICATOR_SIZE }}
                      height={{ custom: INDICATOR_SIZE }}
                      style={{ zIndex: -1 }}
                      background={
                        hardwareTXError
                          ? 'red'
                          : isReady
                          ? 'green'
                          : 'surfaceSecondary'
                      }
                      shadow={
                        IS_IOS
                          ? hardwareTXError
                            ? '30px red'
                            : isReady
                            ? '30px green'
                            : undefined
                          : undefined
                      }
                      borderRadius={INDICATOR_SIZE / 2}
                    />
                  </Box>
                </Inline>
              </Box>
            </ImageBackground>
          </ImageBackground>
        </Box>
        {hardwareTXError && (
          <Box position="absolute" bottom={{ custom: 20 }} width="full">
            <TryAgainButton onPress={onPressTryAgain} />
          </Box>
        )}
      </Box>
    </>
  );
};
