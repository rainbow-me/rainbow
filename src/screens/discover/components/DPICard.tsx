import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@/navigation';
import { ButtonPressAnimation } from '@/components/animations';
import { CoinIcon } from '@/components/coin-icon';
import { analytics } from '@/analytics';
import {
  AccentColorProvider,
  Bleed,
  Box,
  ColorModeProvider,
  Column,
  Columns,
  Cover,
  CustomShadow,
  Heading,
  Inset,
  Stack,
  Text,
  useForegroundColor,
} from '@/design-system';
import { useAccountSettings } from '@/hooks';
import store from '@/redux/store';
import { DPI_ADDRESS } from '@/references';
import Routes from '@rainbow-me/routes';
import { useTheme } from '@/theme';
import { ethereumUtils } from '@/utils';

const ButtonShadow: ViewStyle = {
  shadowColor: 'black',
  shadowOffset: { height: 4, width: 0 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
};

const CardShadow: CustomShadow = {
  custom: {
    android: {
      color: 'accent',
      elevation: 24,
      opacity: 0.5,
    },
    ios: [
      {
        blur: 24,
        color: 'accent',
        x: 0,
        y: 8,
        opacity: 0.35,
      },
    ],
  },
};

export default function DPICard() {
  const { nativeCurrency } = useAccountSettings();
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const handlePress = useCallback(() => {
    const asset = ethereumUtils.formatGenericAsset(
      store.getState().data?.genericAssets?.[DPI_ADDRESS],
      nativeCurrency
    );

    analytics.track('Pressed DPI Button', { category: 'discover' });

    navigate(Routes.TOKEN_INDEX_SHEET, {
      asset,
      backgroundOpacity: 1,
      cornerRadius: 39,
      fromDiscover: true,
      type: 'token_index',
    });
  }, [nativeCurrency, navigate]);

  const shadow = useForegroundColor('shadowFar');
  const shadowColor = useForegroundColor({
    custom: {
      dark: shadow,
      light: '#8360F7',
    },
  });

  return (
    <ButtonPressAnimation
      onPress={handlePress}
      scaleTo={0.92}
      style={
        android && {
          marginTop: -19,
          padding: 19,
        }
      }
      testID="dpi-button"
    >
      <AccentColorProvider color={shadowColor}>
        <Box
          background="body (Deprecated)"
          borderRadius={24}
          shadow={CardShadow}
        >
          <ColorModeProvider value="darkTinted">
            <Box
              as={LinearGradient}
              background="body (Deprecated)"
              borderRadius={24}
              colors={['#6D58F5', '#A970FF']}
              end={{ x: 1, y: 0.5 }}
              start={{ x: 0, y: 0.5 }}
            >
              <Inset
                bottom={{ custom: 20 }}
                horizontal={{ custom: 20 }}
                top={{ custom: 25 }}
              >
                <Stack space={{ custom: 20 }}>
                  <Columns
                    alignHorizontal="justify"
                    alignVertical="top"
                    space="12px"
                  >
                    <Stack space={{ custom: 13 }}>
                      <Heading
                        color="primary (Deprecated)"
                        size="20px / 22px (Deprecated)"
                        weight="bold"
                      >
                        {lang.t('discover.dpi.title')}
                      </Heading>
                      <Text
                        color="secondary60 (Deprecated)"
                        size="15px / 21px (Deprecated)"
                        weight="semibold"
                      >
                        {lang.t('discover.dpi.body')}
                      </Text>
                    </Stack>
                    <Column width="content">
                      <Bleed top="5px (Deprecated)">
                        {/* @ts-expect-error JavaScript component */}
                        <CoinIcon
                          address={DPI_ADDRESS}
                          forcedShadowColor={colors.shadowBlack}
                          shadowOpacity={0.1}
                          symbol="DPI"
                        />
                      </Bleed>
                    </Column>
                  </Columns>
                  <ButtonPressAnimation onPress={handlePress} scaleTo={0.92}>
                    <Box style={ButtonShadow}>
                      <Box
                        as={LinearGradient}
                        background="body (Deprecated)"
                        borderRadius={18}
                        colors={['#5236C2', '#7533D6']}
                        end={{ x: 1, y: 0.5 }}
                        height="36px"
                        start={{ x: 0, y: 0.5 }}
                        width="full"
                      >
                        <Cover alignHorizontal="center" alignVertical="center">
                          <Text
                            align="center"
                            color="primary (Deprecated)"
                            size="15px / 21px (Deprecated)"
                            weight="heavy"
                          >
                            􀦌 {lang.t('discover.dpi.view')}
                          </Text>
                        </Cover>
                      </Box>
                    </Box>
                  </ButtonPressAnimation>
                </Stack>
              </Inset>
            </Box>
          </ColorModeProvider>
        </Box>
      </AccentColorProvider>
    </ButtonPressAnimation>
  );
}
