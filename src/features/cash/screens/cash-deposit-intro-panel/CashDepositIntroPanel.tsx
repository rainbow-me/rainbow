import React, { memo, useCallback } from 'react';
import { Text as NativeText, Platform, StyleSheet } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { analytics } from '@/analytics';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Stack, Text, TextShadow, useColorMode, useForegroundColor } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import { replace, useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { fontWithWidth } from '@/styles/buildTextStyles';

import { CashDepositIntroFeatureRow } from '../../components/CashDepositIntroFeatureRow';

const HERO_DOLLAR_COLOR = '#0086FF';

function VisaBadge({ color }: { color: string }) {
  return (
    <Box alignItems="center" justifyContent="center" paddingLeft="2px" style={[styles.visaBadge, { borderColor: color }]}>
      <Text color="blue" size="11pt" weight="heavy">
        {'VISA'}
      </Text>
    </Box>
  );
}

export const CashDepositIntroPanel = memo(function CashDepositIntroPanel() {
  const { navigate } = useNavigation();
  const { isDarkMode } = useColorMode();
  const blue = useForegroundColor('blue');

  const backgroundGradientColors = isDarkMode
    ? ([opacity(HERO_DOLLAR_COLOR, 0.2), opacity(HERO_DOLLAR_COLOR, 0)] as const)
    : ([opacity(HERO_DOLLAR_COLOR, 0.16), opacity(HERO_DOLLAR_COLOR, 0)] as const);
  const backgroundGradientLocations = isDarkMode ? ([0, 1] as const) : ([0, 0.4583] as const);

  useFocusEffect(
    useCallback(() => {
      analytics.track(analytics.event.cashDepositIntroViewed);
    }, [])
  );

  // Set Up Account → close the intro panel, then open the Cash Deposit Setup wizard.
  const handleSetUpAccount = useCallback(() => {
    replace(Routes.CASH_DEPOSIT_SETUP_SCREEN);
  }, []);

  // Other Deposit Methods → legacy third-party provider widgets.
  const handleOtherDepositMethods = useCallback(() => {
    navigate(Routes.FIAT_ON_RAMP_SHEET);
  }, [navigate]);

  // Sign In → passkey login. Destination lands in a later unit; inert for now.
  const handleSignIn = useCallback(() => {
    // TODO(cash): start passkey OAuth login once the auth unit lands.
  }, []);

  return (
    <PanelSheet>
      <Box>
        <LinearGradient
          colors={backgroundGradientColors}
          end={{ x: 0.5, y: 1 }}
          locations={backgroundGradientLocations}
          pointerEvents="none"
          start={{ x: 0.5, y: 0 }}
          style={styles.gradient}
        />

        <Box flexDirection="row" justifyContent="flex-end" paddingHorizontal="24px" paddingTop="28px">
          <ButtonPressAnimation onPress={handleSignIn} scaleTo={0.92} testID="cash-deposit-intro-sign-in">
            <Text color="blue" size="17pt" weight="bold">
              {i18n.t(i18n.l.cash.deposit_intro.sign_in)}
            </Text>
          </ButtonPressAnimation>
        </Box>

        <Box alignItems="center" paddingTop="32px">
          {Platform.OS === 'android' ? (
            // The DS Text pins Android's line box to the size token's metrics, which crops a glyph
            // scaled this far past the token. Render it raw, with room for the $'s stems.
            <NativeText allowFontScaling={false} style={styles.heroAndroid}>
              {'$'}
            </NativeText>
          ) : (
            <TextShadow blur={36} color={HERO_DOLLAR_COLOR} shadowOpacity={0.2}>
              <Text align="center" color="blue" size="64pt" style={styles.hero} weight="black">
                {'$'}
              </Text>
            </TextShadow>
          )}
          <Box alignItems="center" gap={24} paddingTop="24px">
            <Text align="center" color="blue" size="17pt" style={styles.eyebrow} weight="heavy">
              {i18n.t(i18n.l.cash.deposit_intro.introducing).toUpperCase()}
            </Text>
            <Text align="center" color="label" size="44pt" style={styles.title} weight="heavy">
              {i18n.t(i18n.l.cash.deposit_intro.title)}
            </Text>
          </Box>
        </Box>

        <Box paddingHorizontal="28px" paddingTop="44px">
          <Stack space="32px">
            <CashDepositIntroFeatureRow
              icon={
                <Text align="center" color="blue" size="30pt" weight="medium">
                  {'􀓣'}
                </Text>
              }
              text={i18n.t(i18n.l.cash.deposit_intro.encrypted_feature)}
            />
            <CashDepositIntroFeatureRow icon={<VisaBadge color={blue} />} text={i18n.t(i18n.l.cash.deposit_intro.visa_feature)} />
          </Stack>
        </Box>

        <Box gap={32} paddingBottom="32px" paddingHorizontal="20px" paddingTop="44px">
          <ButtonPressAnimation onPress={handleSetUpAccount} scaleTo={0.96} testID="cash-deposit-intro-set-up-account">
            <Box
              alignItems="center"
              borderRadius={52}
              height={{ custom: 48 }}
              justifyContent="center"
              style={[styles.cta, { backgroundColor: blue, shadowColor: blue }]}
            >
              <Text align="center" color="white" size="22pt" weight="heavy">
                {i18n.t(i18n.l.cash.deposit_intro.set_up_account)}
              </Text>
            </Box>
          </ButtonPressAnimation>
          <ButtonPressAnimation onPress={handleOtherDepositMethods} scaleTo={0.96} testID="cash-deposit-intro-other-deposit-methods">
            <Text align="center" color="blue" size="17pt" weight="heavy">
              {i18n.t(i18n.l.cash.deposit_intro.other_deposit_methods)}
            </Text>
          </ButtonPressAnimation>
        </Box>
      </Box>
    </PanelSheet>
  );
});

const styles = StyleSheet.create({
  cta: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  eyebrow: {
    fontSize: 16,
    letterSpacing: 0.6,
    lineHeight: 18,
  },
  gradient: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  hero: {
    color: HERO_DOLLAR_COLOR,
    fontSize: 118,
    letterSpacing: 0.37,
    lineHeight: 120,
    transform: [{ rotate: '-4.7deg' }],
  },
  // Raw Android counterpart: a tall line box + restored font padding so the stems aren't cropped,
  // then negative margins claw the extra height back so spacing matches the iOS hero.
  heroAndroid: {
    color: HERO_DOLLAR_COLOR,
    fontSize: 118,
    includeFontPadding: true,
    letterSpacing: 0.37,
    lineHeight: 150,
    marginVertical: -15,
    textAlign: 'center',
    textAlignVertical: 'center',
    transform: [{ rotate: '-4.7deg' }],
    ...fontWithWidth(900),
  },
  title: {
    fontSize: 41,
    lineHeight: 45,
  },
  visaBadge: {
    borderRadius: 8,
    borderWidth: 2,
    height: 25,
    width: 40,
  },
});
