import React from 'react';
import { Box, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@/navigation';

const EXIT_BUTTON_SIZE = 36;
// padding top + exit button + inner padding + padding bottom + blur padding
export const TOKEN_LAUNCHER_HEADER_HEIGHT = 20 + 36 + 8 + 12 + 12;

export function TokenLauncherHeader() {
  const navigation = useNavigation();

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
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" padding="4px">
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
        <Text size="20pt" weight="heavy" color="label">
          New Coin
        </Text>
        <Box width={EXIT_BUTTON_SIZE} />
      </Box>
    </Box>
  );
}
