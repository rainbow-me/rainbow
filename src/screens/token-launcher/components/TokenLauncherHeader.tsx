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
import { useTokenLauncherContext } from '../context/TokenLauncherContext';
import { IS_IOS } from '@/env';
import { analyticsV2 } from '@/analytics';

const EXIT_BUTTON_SIZE = 36;
// padding top + exit button + inner padding + padding bottom + blur padding
export const TOKEN_LAUNCHER_HEADER_HEIGHT = 20 + 36 + 8 + 12 + 12;

export function TokenLauncherHeader({ contentContainerHeight }: { contentContainerHeight: number }) {
  const navigation = useNavigation();
  const { width: deviceWidth } = useDimensions();
  const { accountColor, accountImage, accountAddress } = useAccountProfile();
  const hasEnteredAnyInfo = useTokenLauncherStore(state => state.hasEnteredAnyInfo);
  const step = useTokenLauncherStore(state => state.step);
  const setStep = useTokenLauncherStore(state => state.setStep);
  const imageUri = useTokenLauncherStore(state => state.imageUri);
  const getAnalyticsParams = useTokenLauncherStore(state => state.getAnalyticsParams);
  const { tokenImage } = useTokenLauncherContext();

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
      (buttonIndex: number) => {
        if (buttonIndex === 0) {
          navigation.goBack();
          analyticsV2.track(analyticsV2.event.tokenLauncherAbandoned, {
            ...getAnalyticsParams(),
          });
        }
      }
    );
  }, [navigation, hasEnteredAnyInfo, getAnalyticsParams]);

  const isTokenImageVisible = imageUri && tokenImage;

  return (
    <Box
      position="absolute"
      top="0px"
      width={'full'}
      height={TOKEN_LAUNCHER_HEADER_HEIGHT}
      paddingHorizontal={{ custom: THICK_BORDER_WIDTH }}
      zIndex={2}
    >
      <Box paddingHorizontal="20px" paddingTop="20px" paddingBottom="12px" style={{ flex: 1 }}>
        {isTokenImageVisible && IS_IOS ? (
          <BlurGradient
            height={TOKEN_LAUNCHER_HEADER_HEIGHT}
            width={deviceWidth}
            fadeTo="top"
            intensity={12}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <Box
            overflow="hidden"
            height={TOKEN_LAUNCHER_HEADER_HEIGHT - 16}
            width={deviceWidth - THICK_BORDER_WIDTH * 2}
            style={StyleSheet.absoluteFill}
          >
            <Box
              height={contentContainerHeight - THICK_BORDER_WIDTH * 2}
              borderRadius={42 - THICK_BORDER_WIDTH}
              width="full"
              background="surfacePrimary"
            />
          </Box>
        )}
        <Box flexDirection="row" alignItems="center" justifyContent="space-between" padding="4px">
          {step === NavigationSteps.INFO && (
            <ButtonPressAnimation onPress={() => navigation.navigate(Routes.CHANGE_WALLET_SHEET, { hideReadOnlyWallets: true })}>
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
              style={{ width: EXIT_BUTTON_SIZE, height: EXIT_BUTTON_SIZE, justifyContent: 'center', alignItems: 'center' }}
              onPress={() => setStep(NavigationSteps.INFO)}
            >
              <Text size="20pt" weight="heavy" color="label">
                􀆉
              </Text>
            </ButtonPressAnimation>
          )}
          {step === NavigationSteps.CREATING && <Box width={EXIT_BUTTON_SIZE} height={EXIT_BUTTON_SIZE} />}
          <Text size="20pt" weight="heavy" color="label">
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
                background="fillSecondary"
                borderRadius={EXIT_BUTTON_SIZE / 2}
              >
                <BlurView blurIntensity={12} style={StyleSheet.absoluteFill} />
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
