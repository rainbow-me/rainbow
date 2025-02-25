import React, { useCallback } from 'react';
import * as i18n from '@/languages';
import { Box, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@/navigation';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { useAccountProfile } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { AddressAvatar } from '@/screens/change-wallet/components/AddressAvatar';
import { showActionSheetWithOptions } from '@/utils';

const EXIT_BUTTON_SIZE = 36;
// padding top + exit button + inner padding + padding bottom + blur padding
export const TOKEN_LAUNCHER_HEADER_HEIGHT = 20 + 36 + 8 + 12 + 12;

export function TokenLauncherHeader() {
  const navigation = useNavigation();
  const { accountColor, accountImage, accountAddress } = useAccountProfile();
  const reset = useTokenLauncherStore(state => state.reset);
  const step = useTokenLauncherStore(state => state.step);
  const setStep = useTokenLauncherStore(state => state.setStep);
  let title = '';
  if (step === 'info') {
    title = 'New Coin';
  } else if (step === 'review') {
    title = 'Review';
  } else if (step === 'creating') {
    title = 'Creating';
  }

  const handlePressExit = useCallback(() => {
    showActionSheetWithOptions(
      {
        cancelButtonIndex: 1,
        destructiveButtonIndex: 0,
        options: ['Discard & Exit', i18n.t(i18n.l.button.cancel)],
      },
      (buttonIndex: number) => {
        if (buttonIndex === 0) {
          reset();
          navigation.goBack();
        }
      }
    );
  }, [navigation, reset]);

  return (
    <Box
      position="absolute"
      top="0px"
      width="full"
      paddingHorizontal="20px"
      paddingTop="20px"
      paddingBottom="12px"
      height={TOKEN_LAUNCHER_HEADER_HEIGHT}
      zIndex={2}
    >
      {/* TODO: convert to new blur view when available */}
      {/* <BlurView
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        blurType="chromeMaterialDark"
        blurAmount={12}
        reducedTransparencyFallbackColor="rgba(255, 255, 255, 0.06)"
      /> */}
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" padding="4px">
        {step === 'info' && (
          <ButtonPressAnimation onPress={() => navigation.navigate(Routes.CHANGE_WALLET_SHEET)}>
            <AddressAvatar
              url={accountImage}
              address={accountAddress}
              label={accountAddress}
              color={accountColor}
              size={EXIT_BUTTON_SIZE}
            />
          </ButtonPressAnimation>
        )}
        {step === 'review' && (
          <ButtonPressAnimation
            style={{ width: EXIT_BUTTON_SIZE, height: EXIT_BUTTON_SIZE, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setStep('info')}
          >
            <Text size="20pt" weight="heavy" color="label">
              􀆉
            </Text>
          </ButtonPressAnimation>
        )}
        {step === 'creating' && <Box width={EXIT_BUTTON_SIZE} height={EXIT_BUTTON_SIZE} />}
        <Text size="20pt" weight="heavy" color="label">
          {title}
        </Text>
        {step === 'info' && (
          <ButtonPressAnimation onPress={handlePressExit}>
            <Box
              as={BlurView}
              borderWidth={THICK_BORDER_WIDTH}
              alignItems="center"
              justifyContent="center"
              width={EXIT_BUTTON_SIZE}
              height={EXIT_BUTTON_SIZE}
              backgroundColor="fillSecondary"
              borderRadius={EXIT_BUTTON_SIZE / 2}
              blurAmount={12}
              blurType="chromeMaterial"
            >
              <Text size="icon 16px" weight="heavy" color="labelSecondary">
                􀆄
              </Text>
            </Box>
          </ButtonPressAnimation>
        )}
        {(step === 'review' || step === 'creating') && <Box width={EXIT_BUTTON_SIZE} height={EXIT_BUTTON_SIZE} />}
      </Box>
    </Box>
  );
}
