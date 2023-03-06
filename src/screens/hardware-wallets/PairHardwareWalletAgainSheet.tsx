import * as i18n from '@/languages';
import React from 'react';
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
import { Layout } from '@/screens/hardware-wallets/components/Layout';
import { TRANSLATIONS } from '@/screens/hardware-wallets/constants';

const INDICATOR_SIZE = 7;

export const PairHardwareWalletAgainSheet = () => {
  const { isDarkMode } = useTheme();
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
  }));

  return (
    <Layout>
      <Box style={{ zIndex: 1 }}>
        <Inset horizontal="36px">
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
      </Box>
      <Box marginTop={{ custom: -70 }}>
        <ImgixImage
          source={(isDarkMode ? gridDotsDark : gridDotsLight) as Source}
          style={{
            width: GRID_DOTS_SIZE,
            height: GRID_DOTS_SIZE,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          size={GRID_DOTS_SIZE}
        >
          <ImgixImage
            source={ledgerNano as Source}
            style={{
              width: LEDGER_NANO_WIDTH,
              height: LEDGER_NANO_HEIGHT,
              alignItems: 'center',
            }}
            size={LEDGER_NANO_HEIGHT}
          >
            <Box
              height={{ custom: 36 }}
              width={{ custom: 149 }}
              top={{ custom: LEDGER_NANO_HEIGHT / 2 + 80 }}
              borderRadius={18}
              background="surfaceSecondaryElevated"
              shadow="12px"
              alignItems="center"
              justifyContent="center"
            >
              <Inline alignVertical="center" space="8px">
                <Text color="label" weight="semibold" size="17pt">
                  Nano X 7752
                </Text>
                <Box>
                  {!connected && (
                    <Animated.View
                      style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: INDICATOR_SIZE,
                        width: INDICATOR_SIZE,
                        borderRadius: INDICATOR_SIZE / 2,
                        ...(!connected ? indicatorAnimation : {}),
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
                    background={connected ? 'green' : 'surfaceSecondary'}
                    shadow={connected && IS_IOS ? '30px green' : undefined}
                    borderRadius={INDICATOR_SIZE / 2}
                  />
                </Box>
              </Inline>
            </Box>
          </ImgixImage>
        </ImgixImage>
      </Box>
    </Layout>
  );
};
