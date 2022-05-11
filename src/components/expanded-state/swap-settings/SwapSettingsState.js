import { useIsFocused, useRoute } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { InteractionManager, Keyboard } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { useDispatch } from 'react-redux';
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
} from '@rainbow-me/design-system';
import {
  add,
  greaterThan,
  toFixedDecimals,
} from '@rainbow-me/helpers/utilities';

import {
  useAccountSettings,
  useColorForAsset,
  useKeyboardHeight,
  useSwapSlippage,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { deviceUtils } from '@rainbow-me/utils';

function useAndroidDisableGesturesOnFocus() {
  const { params } = useRoute();
  const isFocused = useIsFocused();
  useEffect(() => {
    android && params?.toggleGestureEnabled?.(!isFocused);
  }, [isFocused, params]);
}

export default function SwapSettingsState({ asset }) {
  const {
    flashbotsEnabled,
    settingsChangeFlashbotsEnabled,
  } = useAccountSettings();
  const { colors } = useTheme();
  const { setParams, goBack } = useNavigation();
  useAndroidDisableGesturesOnFocus();
  const dispatch = useDispatch();

  const toggleFlashbotsEnabled = useCallback(async () => {
    await dispatch(settingsChangeFlashbotsEnabled(!flashbotsEnabled));
  }, [dispatch, flashbotsEnabled, settingsChangeFlashbotsEnabled]);

  const keyboardHeight = useKeyboardHeight();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true);

  const { slippageInBips, updateSwapSlippage } = useSwapSlippage();

  useEffect(() => {
    const keyboardDidShow = () => {
      setIsKeyboardOpen(true);
    };

    const keyboardDidHide = () => {
      setIsKeyboardOpen(false);
    };
    android && Keyboard.addListener('keyboardDidShow', keyboardDidShow);
    android && Keyboard.addListener('keyboardDidHide', keyboardDidHide);
    return () => {
      Keyboard.removeListener('keyboardDidShow', keyboardDidShow);
      Keyboard.removeListener('keyboardDidHide', keyboardDidHide);
    };
  }, []);

  const colorForAsset = useColorForAsset(asset || {}, null, false, true);

  const sheetHeightWithoutKeyboard = 185;

  const sheetHeightWithKeyboard =
    sheetHeightWithoutKeyboard +
    keyboardHeight +
    (deviceUtils.isSmallPhone ? 30 : 0);

  useEffect(() => {
    setParams({ longFormHeight: sheetHeightWithKeyboard });
  }, [sheetHeightWithKeyboard, setParams]);

  const convertBipsToPercent = bips => bips / 100;
  const convertPercentToBips = percent => percent * 100;

  const [slippageValue, setSlippageValue] = useState(
    convertBipsToPercent(slippageInBips)
  );

  const slippageRef = useRef(null);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        slippageRef?.current.focus();
      }, 200);
    });
  }, []);

  const handleSlippagePress = useCallback(() => slippageRef?.current?.focus(), [
    slippageRef,
  ]);

  const onSlippageChange = value => {
    updateSwapSlippage(convertPercentToBips(value));
    setSlippageValue(value);
  };

  const updateSlippage = useCallback(
    increment => {
      //setLastFocusedInputHandle(maxBaseFieldRef)
      const newSlippageValue = toFixedDecimals(
        add(slippageValue, increment),
        2
      );
      if (greaterThan(0, newSlippageValue)) return;

      updateSwapSlippage(convertPercentToBips(newSlippageValue));
      setSlippageValue(newSlippageValue);
    },
    [slippageValue, updateSwapSlippage]
  );

  const SLIPPAGE_INCREMENT = 0.1;
  const addSlippage = useCallback(() => {
    updateSlippage(SLIPPAGE_INCREMENT);
  }, [updateSlippage]);

  const minusSlippage = useCallback(() => {
    updateSlippage(-SLIPPAGE_INCREMENT);
  }, [updateSlippage]);

  return (
    <SlackSheet
      additionalTopPadding
      backgroundColor={colors.transparent}
      contentHeight={
        isKeyboardOpen ? sheetHeightWithKeyboard : sheetHeightWithoutKeyboard
      }
      hideHandle
      radius={0}
      scrollEnabled={false}
    >
      <FloatingPanel radius={android ? 30 : 39}>
        <ExchangeHeader testID="swap-settings" />
        <Inset bottom="24px" horizontal="24px" top="10px">
          <Stack backgroundColor="green" space="10px">
            <Columns alignVertical="center">
              <Text size="18px" weight="bold">
                Slippage Tolerance
              </Text>
              <Column width="content">
                <StepButtonInput
                  buttonColor={colorForAsset}
                  inputLabel="%"
                  inputRef={slippageRef}
                  minusAction={minusSlippage}
                  onChange={onSlippageChange}
                  onPress={handleSlippagePress}
                  plusAction={addSlippage}
                  testID="swap-slippage-input"
                  value={slippageValue}
                />
              </Column>
            </Columns>
            {asset?.type === 'token' && (
              <Columns alignHorizontal="justify" alignVertical="center">
                <Text color="primary" size="18px" weight="bold">
                  Use Flashbots
                </Text>
                <Column width="content">
                  <Switch
                    onValueChange={toggleFlashbotsEnabled}
                    trackColor={{ false: '#767577', true: colorForAsset }}
                    value={flashbotsEnabled}
                  />
                </Column>
              </Columns>
            )}
          </Stack>
        </Inset>
      </FloatingPanel>
      <ColorModeProvider value="dark">
        <Inset horizontal="24px" top="24px">
          <Columns alignHorizontal="justify">
            <Column width="content">
              <ButtonPressAnimation>
                <Box
                  borderRadius={20}
                  style={{ borderColor: colorForAsset, borderWidth: 2 }}
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
              <ButtonPressAnimation
                onPress={() => {
                  slippageRef?.current?.blur();
                  goBack();
                }}
              >
                <Box
                  borderRadius={20}
                  style={{ borderColor: colorForAsset, borderWidth: 2 }}
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
