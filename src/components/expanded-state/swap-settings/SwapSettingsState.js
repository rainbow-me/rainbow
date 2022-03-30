import React, { useEffect } from 'react';
import { Switch } from 'react-native-gesture-handler';
import { ButtonPressAnimation } from '../../animations';
import { ExchangeHeader } from '../../exchange';
import { FloatingPanel } from '../../floating-panels';
import { SlackSheet } from '../../sheet';
import StepButtonInput from './StepButtonInput';
import {
  Box,
  ColorModeProvider,
  Column,
  Columns,
  Inset,
  Stack,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';
import {
  useAccountSettings,
  useColorForAsset,
  useDimensions,
  useKeyboardHeight,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { deviceUtils } from '@rainbow-me/utils';

export default function SwapSettingsState({ asset }) {
  const { network } = useAccountSettings();
  const { colors } = useTheme();
  const { height: deviceHeight } = useDimensions();
  const { setParams } = useNavigation();
  const keyboardHeight = useKeyboardHeight();
  const colorForAsset = useColorForAsset(asset || {}, null, false, true);
  const secondary50 = useForegroundColor('secondary50');

  const sheetHeightWithoutKeyboard = 300;

  const sheetHeightWithKeyboard =
    sheetHeightWithoutKeyboard +
    keyboardHeight +
    (deviceUtils.isSmallPhone ? 30 : 0);

  useEffect(() => {
    setParams({ longFormHeight: sheetHeightWithKeyboard });
  }, [sheetHeightWithKeyboard, setParams]);

  return (
    <SlackSheet
      additionalTopPadding
      backgroundColor={colors.transparent}
      contentHeight={sheetHeightWithoutKeyboard}
      hideHandle
      radius={0}
      scrollEnabled={false}
    >
      <ColorModeProvider value="light">
        <FloatingPanel radius={android ? 30 : 39}>
          <Inset bottom="24px" horizontal="24px">
            <ExchangeHeader testID="swap-settings" title="Swap Settings" />
            <Stack backgroundColor="green" space="10px">
              <Columns alignVertical="center">
                <Text size="18px" weight="bold">
                  Slippage Tolerance
                </Text>
                <Column width="content">
                  <StepButtonInput buttonColor={colors.black} inputLabel="%" />
                </Column>
              </Columns>
              <Columns alignHorizontal="justify" alignVertical="center">
                <Text color="primary" size="18px" weight="bold">
                  Use Flashbots
                </Text>
                <Column width="content">
                  <Switch ios_backgroundColor={colors.black} />
                </Column>
              </Columns>
            </Stack>
          </Inset>
        </FloatingPanel>
      </ColorModeProvider>
      <ColorModeProvider value="dark">
        <Inset horizontal="24px" top="24px">
          <Columns alignHorizontal="justify">
            <Column width="content">
              <ButtonPressAnimation>
                <Box
                  borderRadius={20}
                  style={{ borderColor: secondary50, borderWidth: 1 }}
                >
                  <Inset space="8px">
                    <Text color="primary" weight="bold">
                      Use Defaults
                    </Text>
                  </Inset>
                </Box>
              </ButtonPressAnimation>
            </Column>
            <Column width="content">
              <ButtonPressAnimation>
                <Box
                  borderRadius={20}
                  style={{ borderColor: secondary50, borderWidth: 1 }}
                >
                  <Inset space="8px">
                    <Text color="primary" weight="bold">
                      Done
                    </Text>
                  </Inset>
                </Box>
              </ButtonPressAnimation>
            </Column>
          </Columns>
        </Inset>
      </ColorModeProvider>
    </SlackSheet>
  );
}
