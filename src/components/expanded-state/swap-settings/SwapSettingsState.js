import { useIsFocused, useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useEffect } from 'react';
import { Keyboard } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { useDispatch } from 'react-redux';
import { ButtonPressAnimation } from '../../animations';
import { ExchangeHeader } from '../../exchange';
import { FloatingPanel } from '../../floating-panels';
import { SlackSheet } from '../../sheet';
import { MaxToleranceInput } from './MaxToleranceInput';
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
  useAccountSettings,
  useColorForAsset,
  useKeyboardHeight,
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
  const slippageRef = useRef(null);

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

  const resetToDefaults = useCallback(() => {
    slippageRef?.current?.reset();
    settingsChangeFlashbotsEnabled(false);
  }, [slippageRef, settingsChangeFlashbotsEnabled]);

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
      testID="swap-settings-state"
    >
      <FloatingPanel radius={android ? 30 : 39} testID="swap-settings">
        <ExchangeHeader />
        <Inset bottom="24px" horizontal="24px" top="10px">
          <Stack backgroundColor="green" space="24px">
            {asset?.type === 'token' && (
              <Columns alignHorizontal="justify" alignVertical="center">
                <Text color="primary" size="18px" weight="bold">
                  {lang.t('exchange.use_flashbots')}
                </Text>
                <Column width="content">
                  <Switch
                    onValueChange={toggleFlashbotsEnabled}
                    testID="swap-settings-flashbots-switch"
                    trackColor={{ false: '#767577', true: colorForAsset }}
                    value={flashbotsEnabled}
                  />
                </Column>
              </Columns>
            )}
            <MaxToleranceInput
              ref={slippageRef}
              colorForAsset={colorForAsset}
            />
          </Stack>
        </Inset>
      </FloatingPanel>
      <ColorModeProvider value="dark">
        <Inset horizontal="24px" top="24px">
          <Columns alignHorizontal="justify">
            <Column width="content">
              <ButtonPressAnimation onPress={resetToDefaults}>
                <Box
                  borderRadius={20}
                  style={{ borderColor: colorForAsset, borderWidth: 2 }}
                >
                  <Inset space="8px">
                    <Text color="primary" weight="bold">
                      {lang.t('exchange.use_defaults')}
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
                      {lang.t('exchange.done')}
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
