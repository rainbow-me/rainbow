import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import * as i18n from '@/languages';
import { Box, Text, TextIcon } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { BlurView } from 'react-native-blur-view';
import { useNavigation } from '@/navigation';
import { NavigationSteps, useTokenLauncherStore } from '../state/tokenLauncherStore';
import { useAccountProfile, useDimensions } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { AddressAvatar } from '@/screens/change-wallet/components/AddressAvatar';
import { showActionSheetWithOptions } from '@/utils';
import { BlurGradient } from '@/components/blur/BlurGradient';
import { analyticsV2 } from '@/analytics';

const EXIT_BUTTON_SIZE = 36;
// padding top + exit button + inner padding + padding bottom + blur padding
export const TOKEN_LAUNCHER_HEADER_HEIGHT = 20 + 36 + 4 + 12 + 12;
export const TOKEN_LAUNCHER_SCROLL_INDICATOR_INSETS = { bottom: 42, top: TOKEN_LAUNCHER_HEADER_HEIGHT };

export function TokenLauncherHeader() {
  const navigation = useNavigation();
  const { width: deviceWidth } = useDimensions();
  const { accountColor, accountImage, accountAddress } = useAccountProfile();
  const hasEnteredAnyInfo = useTokenLauncherStore(state => state.hasEnteredAnyInfo);
  const step = useTokenLauncherStore(state => state.step);
  const setStep = useTokenLauncherStore(state => state.setStep);
  const getAnalyticsParams = useTokenLauncherStore(state => state.getAnalyticsParams);

  let title = '';
  if (step === NavigationSteps.INFO) {
    title = i18n.t(i18n.l.token_launcher.header.new_coin);
  } else if (step === NavigationSteps.REVIEW) {
    title = i18n.t(i18n.l.token_launcher.header.review);
  } else if (step === NavigationSteps.CREATING) {
    title = i18n.t(i18n.l.token_launcher.header.creating);
  }

  const handlePressExit = useCallback(() => {
    if (!hasEnteredAnyInfo()) {
      navigation.goBack();
      return;
    }

    showActionSheetWithOptions(
      {
        cancelButtonIndex: 1,
        destructiveButtonIndex: 0,
        options: [i18n.t(i18n.l.token_launcher.discard_and_exit), i18n.t(i18n.l.button.cancel)],
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          navigation.goBack();
          analyticsV2.track(analyticsV2.event.tokenLauncherAbandoned, {
            ...getAnalyticsParams(),
          });
        }
      }
    );
  }, [navigation, hasEnteredAnyInfo, getAnalyticsParams]);

  return (
    <Box position="absolute" top="0px" width={'full'} height={TOKEN_LAUNCHER_HEADER_HEIGHT} pointerEvents="box-none" zIndex={2}>
      <Box paddingHorizontal="20px" paddingTop="20px" paddingBottom="12px" pointerEvents="box-none" style={{ flex: 1 }}>
        <BlurGradient
          height={TOKEN_LAUNCHER_HEADER_HEIGHT}
          width={deviceWidth}
          fadeTo="top"
          intensity={12}
          style={StyleSheet.absoluteFill}
        />
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" padding="2px" pointerEvents="box-none">
          {step === NavigationSteps.INFO && (
            <ButtonPressAnimation
              onPress={() => navigation.navigate(Routes.CHANGE_WALLET_SHEET, { hideReadOnlyWallets: true })}
              scaleTo={0.8}
            >
              <AddressAvatar
                url={accountImage}
                address={accountAddress}
                label={accountAddress}
                color={accountColor}
                size={EXIT_BUTTON_SIZE}
              />
            </ButtonPressAnimation>
          )}
          {step === NavigationSteps.REVIEW && (
            <ButtonPressAnimation
              scaleTo={0.8}
              style={{
                width: EXIT_BUTTON_SIZE,
                height: EXIT_BUTTON_SIZE,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => setStep(NavigationSteps.INFO)}
            >
              <TextIcon size="icon 20px" weight="heavy" color="label">
                􀆉
              </TextIcon>
            </ButtonPressAnimation>
          )}
          {step === NavigationSteps.CREATING && <Box width={EXIT_BUTTON_SIZE} height={EXIT_BUTTON_SIZE} />}
          <Text align="center" size="20pt" weight="heavy" color="label">
            {title}
          </Text>
          {step === NavigationSteps.INFO && (
            <ButtonPressAnimation onPress={handlePressExit}>
              <Box
                borderWidth={THICK_BORDER_WIDTH}
                alignItems="center"
                justifyContent="center"
                width={EXIT_BUTTON_SIZE}
                height={EXIT_BUTTON_SIZE}
                background="fillTertiary"
                borderRadius={EXIT_BUTTON_SIZE / 2}
              >
                <BlurView blurIntensity={12} blurStyle="plain" style={StyleSheet.absoluteFill} />
                <TextIcon containerSize={EXIT_BUTTON_SIZE} size="icon 16px" weight="heavy" color="labelSecondary">
                  {'􀆄'}
                </TextIcon>
              </Box>
            </ButtonPressAnimation>
          )}
          {(step === NavigationSteps.REVIEW || step === NavigationSteps.CREATING) && (
            <Box width={EXIT_BUTTON_SIZE} height={EXIT_BUTTON_SIZE} />
          )}
        </Box>
      </Box>
    </Box>
  );
}
