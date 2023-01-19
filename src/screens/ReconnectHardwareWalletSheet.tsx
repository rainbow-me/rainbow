import * as i18n from '@/languages';
import React from 'react';
import { Box, Inline, Inset, Stack, Text } from '@/design-system';
import { TRANSLATIONS } from '@/navigation/PairHardwareWalletNavigator';
import { ImgixImage } from '@/components/images';
import ledgerNano from '@/assets/ledger-nano.png';
import {
  ledgerNanoHeight,
  ledgerNanoWidth,
} from '@/components/hardware-wallets/NanoXDeviceAnimation';
import { Source } from 'react-native-fast-image';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useDimensions } from '@/hooks';
import { CancelButton } from '@/components/hardware-wallets/CancelButton';

export const ReconnectHardwareWalletSheet = () => {
  const { isSmallPhone } = useDimensions();
  const connected = false;

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
    zIndex: 2,
  }));

  return (
    <Box justifyContent="space-between" alignItems="center" height="full">
      <Stack space={{ custom: isSmallPhone ? 20 : 0 }}>
        <Inset horizontal="36px" top={{ custom: 55 }}>
          <Stack alignHorizontal="center" space="20px">
            <Text align="center" color="label" weight="bold" size="26pt">
              {i18n.t(TRANSLATIONS.looking_for_devices)}
            </Text>
            <Stack space="10px">
              <Text
                align="center"
                color="labelTertiary"
                weight="semibold"
                size="15pt / 135%"
              >
                {i18n.t(TRANSLATIONS.make_sure_bluetooth_enabled)}
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
                  background={connected ? 'green' : 'surfaceSecondary'}
                  shadow={connected ? '30px green' : undefined}
                  position="absolute"
                  style={{ zIndex: 1 }}
                  borderRadius={3.5}
                />
              </Box>
            </Inline>
          </Box>
        </Box>
      </Stack>
      <Box position="absolute" top={{ custom: 510 }}>
        <Inset horizontal="20px">
          <CancelButton />
        </Inset>
      </Box>
    </Box>
  );
};
