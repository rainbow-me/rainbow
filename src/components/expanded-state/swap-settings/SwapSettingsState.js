import { useIsFocused, useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useRef } from 'react';
import { Keyboard } from 'react-native';
import { Switch } from 'react-native-gesture-handler';
import { useDispatch } from 'react-redux';
import { ButtonPressAnimation } from '../../animations';
import { ExchangeHeader } from '../../exchange';
import { FloatingPanel } from '../../floating-panels';
import { SlackSheet } from '../../sheet';
import { MaxToleranceInput } from './MaxToleranceInput';
import SourcePicker from './SourcePicker';

import { Box, ColorModeProvider, Column, Columns, Inset, Stack, Text } from '@/design-system';

import { useAccountSettings, useColorForAsset, useKeyboardHeight, useSwapSettings } from '@/hooks';
import { useNavigation } from '@/navigation';
import { Source } from '@/raps/references';
import Routes from '@/navigation/routesNames';
import { deviceUtils } from '@/utils';
import { IS_ANDROID } from '@/env';
const MAX_TEXT_WIDTH = 210;

function useAndroidDisableGesturesOnFocus() {
  const { params } = useRoute();
  const isFocused = useIsFocused();
  useEffect(() => {
    android && params?.toggleGestureEnabled?.(!isFocused);
  }, [isFocused, params]);
}

export default function SwapSettingsState({ asset }) {
  const { flashbotsEnabled, settingsChangeFlashbotsEnabled } = useAccountSettings();
  const {
    params: { swapSupportsFlashbots = false, network },
  } = useRoute();
  const { colors } = useTheme();
  const { setParams, goBack } = useNavigation();
  const dispatch = useDispatch();
  const keyboardHeight = useKeyboardHeight();
  const slippageRef = useRef(null);
  const { updateSwapSource, source } = useSwapSettings();
  const isFocused = useIsFocused();
  const { navigate } = useNavigation();
  const keyboardShowListener = useRef(null);
  const keyboardHideListener = useRef(null);
  useAndroidDisableGesturesOnFocus();

  const handleKeyboardDidHide = useCallback(() => {
    if (isFocused) {
      goBack();
    }
  }, [goBack, isFocused]);
  const handleKeyboardDidShow = useCallback(() => {
    if (!isFocused) {
      Keyboard.dismiss();
    }
  }, [isFocused]);
  const toggleFlashbotsEnabled = useCallback(async () => {
    await dispatch(settingsChangeFlashbotsEnabled(!flashbotsEnabled));
  }, [dispatch, flashbotsEnabled, settingsChangeFlashbotsEnabled]);

  useEffect(() => {
    if (IS_ANDROID) {
      keyboardShowListener.current = Keyboard.addListener('keyboardDidShow', handleKeyboardDidShow);
      keyboardHideListener.current = Keyboard.addListener('keyboardDidHide', handleKeyboardDidHide);
    }
    return () => {
      keyboardShowListener.current?.remove();
      keyboardHideListener.current?.remove();
    };
  }, [handleKeyboardDidHide, handleKeyboardDidShow]);

  const colorForAsset = useColorForAsset(asset || {}, null, false, true);

  const [currentSource, setCurrentSource] = useState(source);
  const updateSource = useCallback(
    newSource => {
      setCurrentSource(newSource);
      updateSwapSource(newSource);
    },
    [updateSwapSource]
  );

  const sheetHeightWithoutKeyboard = (android ? 275 : 245) + (swapSupportsFlashbots ? 55 : 0);

  const sheetHeightWithKeyboard = sheetHeightWithoutKeyboard + keyboardHeight + (deviceUtils.isSmallPhone ? 30 : 0);

  useEffect(() => {
    setParams({ longFormHeight: sheetHeightWithKeyboard });
  }, [sheetHeightWithKeyboard, setParams]);

  const resetToDefaults = useCallback(() => {
    slippageRef?.current?.reset();
    settingsChangeFlashbotsEnabled(false);
    updateSource(Source.AggregatorRainbow);
  }, [settingsChangeFlashbotsEnabled, updateSource]);

  const openFlashbotsExplainer = () => {
    Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'flashbots',
    });
  };

  return (
    <SlackSheet
      additionalTopPadding
      backgroundColor={colors.transparent}
      contentHeight={sheetHeightWithKeyboard}
      hideHandle
      radius={0}
      scrollEnabled={false}
      testID="swap-settings-state"
    >
      <FloatingPanel borderRadius={android ? 30 : 39} testID="swap-settings">
        <ExchangeHeader testID="swap-settings" />
        <Inset bottom="24px" horizontal="24px" top="10px">
          <Stack space="24px">
            <Text align="center" color="primary (Deprecated)" size="18px / 27px (Deprecated)" weight="bold">
              {lang.t('exchange.settings')}
            </Text>
            <SourcePicker currentSource={currentSource} onSelect={updateSource} />
            {swapSupportsFlashbots && (
              <Columns alignHorizontal="justify" alignVertical="center">
                <Column width="content">
                  <Box
                    as={ButtonPressAnimation}
                    testID="swap-settings-flashbots-label"
                    {...(ios ? { marginVertical: '-12px' } : {})}
                    // @ts-expect-error
                    onPress={openFlashbotsExplainer}
                    paddingVertical="12px"
                    style={{ maxWidth: MAX_TEXT_WIDTH }}
                  >
                    <Text color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="bold" numberOfLines={2}>
                      {lang.t('exchange.use_flashbots')}
                      <Text color="secondary30 (Deprecated)" size="16px / 22px (Deprecated)" weight="bold">
                        {' 􀅵'}
                      </Text>
                    </Text>
                  </Box>
                </Column>
                <Column width="content">
                  <Switch
                    onValueChange={toggleFlashbotsEnabled}
                    testID={`swap-settings-flashbots-switch-${flashbotsEnabled}`}
                    trackColor={{ false: '#767577', true: colorForAsset }}
                    value={flashbotsEnabled}
                  />
                </Column>
              </Columns>
            )}
            <MaxToleranceInput colorForAsset={colorForAsset} currentNetwork={network} ref={slippageRef} />
          </Stack>
        </Inset>
      </FloatingPanel>
      <ColorModeProvider value="dark">
        <Inset horizontal="24px" top="24px">
          <Columns alignHorizontal="justify">
            <Column width="content">
              <ButtonPressAnimation onPress={resetToDefaults} testID="swap-settings-defaults-button">
                <Box
                  borderRadius={20}
                  style={{
                    borderColor: colorForAsset,
                    borderWidth: 2,
                    maxWidth: 200,
                  }}
                >
                  <Inset space="8px" top={{ custom: android ? 6 : 8 }}>
                    <Text color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="bold" numberOfLines={1}>
                      {lang.t('exchange.use_defaults')}
                    </Text>
                  </Inset>
                </Box>
              </ButtonPressAnimation>
            </Column>
            <Column width="content">
              <ButtonPressAnimation
                onPress={() => {
                  ios && slippageRef?.current?.blur();
                  goBack();
                }}
                style={{ maxWidth: 130 }}
              >
                <Box borderRadius={20} style={{ borderColor: colorForAsset, borderWidth: 2 }}>
                  <Inset space="8px" top={{ custom: android ? 6 : 8 }}>
                    <Text color="primary (Deprecated)" size="16px / 22px (Deprecated)" weight="bold" numberOfLines={1}>
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
