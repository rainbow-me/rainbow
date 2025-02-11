import React from 'react';
import { Box, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@/navigation';
import { useTokenLauncherStore } from '../state/tokenLauncherStore';
import { useAccountProfile } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { AddressAvatar } from '@/screens/change-wallet/components/AddressAvatar';

const EXIT_BUTTON_SIZE = 36;
// padding top + exit button + inner padding + padding bottom + blur padding
export const TOKEN_LAUNCHER_HEADER_HEIGHT = 20 + 36 + 8 + 12 + 12;

export function TokenLauncherHeader() {
  const navigation = useNavigation();
  // const { accountAddress } = useAccountSettings();
  const { accountColor, accountImage, accountAddress } = useAccountProfile();

  const step = useTokenLauncherStore(state => state.step);
  const setStep = useTokenLauncherStore(state => state.setStep);

  return (
    <Box
      position="absolute"
      top="0px"
      width="full"
      paddingHorizontal="20px"
      paddingTop="20px"
      paddingBottom="12px"
      height={TOKEN_LAUNCHER_HEADER_HEIGHT}
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
        {step === 'overview' && (
          <ButtonPressAnimation
            style={{ width: EXIT_BUTTON_SIZE, height: EXIT_BUTTON_SIZE, justifyContent: 'center', alignItems: 'center' }}
            onPress={() => setStep('info')}
          >
            <Text size="20pt" weight="heavy" color="label">
              􀆉
            </Text>
          </ButtonPressAnimation>
        )}
        <Text size="20pt" weight="heavy" color="label">
          {step === 'info' ? 'New Coin' : 'Overview'}
        </Text>
        {step === 'info' && (
          <ButtonPressAnimation onPress={() => navigation.goBack()}>
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
        {step === 'overview' && <Box width={EXIT_BUTTON_SIZE} />}
      </Box>
    </Box>
  );
}
