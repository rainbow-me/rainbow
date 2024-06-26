import { ButtonPressAnimation } from '@/components/animations';
import {
  Bleed,
  Box,
  Column,
  Columns,
  Inline,
  Row,
  Rows,
  Stack,
  Text,
  globalColors,
  useColorMode,
  useForegroundColor,
  useTextStyle,
} from '@/design-system';
import { IS_IOS } from '@/env';
import { metadataPOSTClient } from '@/graphql';
import { useAccountAccentColor, useDimensions, useKeyboardHeight, useWallets } from '@/hooks';
import { useNavigation } from '@/navigation';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { haptics, watchingAlert } from '@/utils';
import { delay } from '@/utils/delay';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Keyboard, TextInput } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { PointsErrorType } from '@/graphql/__generated__/metadataPOST';
import { RainbowError, logger } from '@/logger';
import { ActionButton } from '@/screens/points/components/ActionButton';
import { PointsIconAnimation } from '../components/PointsIconAnimation';
import { usePointsReferralCode } from '@/resources/points';
import { analyticsV2 } from '@/analytics';
import Clipboard from '@react-native-clipboard/clipboard';

const keyboardSpringConfig = {
  damping: 500,
  mass: 3,
  stiffness: 1000,
};

const parseReferralCodeFromLink = (code: string) => {
  if (code.startsWith('https://rainbow.me/points?ref=') || code.startsWith('https://www.rainbow.me/points?ref=')) {
    const [, refCode] = code.split('=');
    if (!refCode) return;

    const trimmed = refCode.replace(/-/g, '').slice(0, 6).toLocaleUpperCase();

    return trimmed;
  }

  return;
};

export function ReferralContent() {
  const { accentColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();
  const { goBack, navigate } = useNavigation();
  const { isReadOnlyWallet } = useWallets();

  const label = useForegroundColor('label');
  const labelQuaternary = useForegroundColor('labelQuaternary');

  const { width: deviceWidth } = useDimensions();
  const keyboardHeight = useKeyboardHeight();
  const { data: externalReferralCode } = usePointsReferralCode();

  const [referralCodeDisplay, setReferralCodeDisplay] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [deeplinked, setDeeplinked] = useState(false);
  const [status, setStatus] = useState<'incomplete' | 'valid' | 'invalid'>('incomplete');
  const [goingBack, setGoingBack] = useState(false);

  const textInputRef = React.useRef<TextInput>(null);

  const validateReferralCode = useCallback(
    async (code: string) => {
      if (code.length !== 6) return false;
      const res = await metadataPOSTClient.validateReferral({
        code,
      });
      if (!res?.validateReferral?.valid) {
        if (res.validateReferral?.error?.type === PointsErrorType.InvalidReferralCode) {
          setStatus('invalid');
          haptics.notificationError();
        } else {
          logger.error(new RainbowError('Error validating referral code'), {
            referralCode: code,
          });
          Alert.alert(i18n.t(i18n.l.points.referral.error));
        }
      } else {
        setStatus('valid');
        analyticsV2.track(analyticsV2.event.pointsReferralScreenValidatedReferralCode, { deeplinked });
        setReferralCode(code);
        textInputRef.current?.blur();
        haptics.notificationSuccess();
        return true;
      }

      return false;
    },
    [deeplinked]
  );

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isKeyboardOpening, setIsKeyboardOpening] = useState(false);

  const hasKeyboard = IS_IOS ? isKeyboardOpening : isKeyboardVisible;

  const contentBottom = hasKeyboard ? keyboardHeight - TAB_BAR_HEIGHT + (IS_IOS ? 0 : 16) : 0;

  const contentBottomSharedValue = useSharedValue(contentBottom);

  useEffect(() => {
    contentBottomSharedValue.value = withSpring(contentBottom, keyboardSpringConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentBottom]);

  useFocusEffect(
    useCallback(() => {
      analyticsV2.track(analyticsV2.event.pointsViewedReferralScreen);
      setGoingBack(false);
      if (status !== 'valid') {
        delay(600).then(() => textInputRef.current?.focus());
      }
    }, [status])
  );

  useEffect(() => {
    if (externalReferralCode) {
      setDeeplinked(true);
      setReferralCodeDisplay(externalReferralCode);
      validateReferralCode(externalReferralCode.replace(/-/g, '').slice(0, 6).toLocaleUpperCase());
    }
  }, [externalReferralCode, validateReferralCode]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });
    const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', () => {
      setIsKeyboardOpening(true);
    });
    const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
      setIsKeyboardOpening(false);
    });

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
      keyboardWillHideListener.remove();
      keyboardWillShowListener.remove();
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: contentBottomSharedValue.value,
    };
  });

  const red = useForegroundColor('red');
  const statusColor = status === 'invalid' ? red : accentColor;
  const inputTextStyle = useTextStyle({
    align: 'left',
    color: 'label',
    size: '20pt',
    weight: 'heavy',
  });

  const onChangeText = useCallback(
    async (code: string) => {
      if (goingBack) return;
      if (code === 'https:/') {
        const url = await Clipboard.getString();
        const codeFromUrl = parseReferralCodeFromLink(url);
        if (codeFromUrl) {
          const formattedCode = codeFromUrl.slice(0, 3) + '-' + codeFromUrl.slice(3, 7);
          setReferralCodeDisplay(formattedCode);
          if (formattedCode.length !== 7) {
            setStatus('incomplete');
          } else {
            validateReferralCode(codeFromUrl);
          }
        }
        return;
      }

      const rawCode = code.replace(/-/g, '').slice(0, 6).toLocaleUpperCase();
      let formattedCode = rawCode;

      // If the user backspaces over the hyphen, remove the character before the hyphen
      if (referralCodeDisplay.length === 4 && code.length === 3) {
        formattedCode = formattedCode.slice(0, -1);
      }

      // Insert "-" after the 3rd character if the length is 4 or more
      if (formattedCode.length >= 3) {
        formattedCode = formattedCode.slice(0, 3) + '-' + formattedCode.slice(3, 7);
      }

      // Update the state and the input
      setReferralCodeDisplay(formattedCode); // Limit to 6 characters + '-'

      if (formattedCode.length !== 7) {
        setStatus('incomplete');
      } else {
        validateReferralCode(rawCode);
      }
    },
    [goingBack, referralCodeDisplay.length, validateReferralCode]
  );

  return (
    <Box
      alignItems="center"
      background="surfacePrimary"
      justifyContent="center"
      paddingBottom="20px"
      paddingHorizontal="20px"
      style={{ backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD', flex: 1 }}
    >
      <Box alignItems="center" as={Animated.View} justifyContent="center" style={animatedStyle} width="full">
        <Rows>
          <Box
            alignItems="center"
            justifyContent="center"
            paddingHorizontal={{ custom: 60 }}
            style={{ flex: 1 }}
            width={{ custom: deviceWidth }}
          >
            <Stack space="16px" alignHorizontal="center">
              <Stack space="32px" alignHorizontal="center">
                <Stack space="20px" alignHorizontal="center">
                  <Stack space="28px" alignHorizontal="center">
                    <PointsIconAnimation />
                    <Text size="22pt" weight="heavy" align="center" color="label">
                      {i18n.t(i18n.l.points.referral.title)}
                    </Text>
                  </Stack>
                  <Text size="15pt" weight="semibold" align="center" color="labelTertiary">
                    {i18n.t(i18n.l.points.referral.subtitle)}
                  </Text>
                </Stack>

                <Box
                  background="surfacePrimary"
                  style={{
                    borderRadius: 18,
                    borderWidth: 2,
                    borderColor: statusColor,
                    height: 48,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 20,
                    minWidth: IS_IOS ? 140 : undefined,
                    shadowOffset: {
                      width: 0,
                      height: 13,
                    },
                    shadowRadius: 26,
                    shadowColor: statusColor,
                    shadowOpacity: 0.1,
                    elevation: 26,
                  }}
                >
                  <Inline alignVertical="center" space="6px">
                    <TextInput
                      ref={textInputRef}
                      value={referralCodeDisplay}
                      style={{
                        height: 48,
                        ...(IS_IOS
                          ? inputTextStyle
                          : {
                              color: label,
                            }),
                      }}
                      autoCorrect={false}
                      autoFocus={false}
                      spellCheck={false}
                      maxLength={7}
                      selectionColor={statusColor}
                      textAlign="left"
                      autoCapitalize="characters"
                      placeholder="XXX-XXX"
                      placeholderTextColor={labelQuaternary}
                      onChangeText={onChangeText}
                    />
                    {status === 'valid' && (
                      <Bleed horizontal="2px">
                        <Text weight="heavy" size="17pt" align="center" color={{ custom: accentColor }}>
                          􀁣
                        </Text>
                      </Bleed>
                    )}
                  </Inline>
                </Box>
              </Stack>
              <Text size="13pt" weight="heavy" align="center" color={{ custom: status === 'invalid' ? red : 'transparent' }}>
                {i18n.t(i18n.l.points.referral.invalid_code)}
              </Text>
            </Stack>
          </Box>
          {!hasKeyboard && status === 'valid' ? (
            <Row height="content">
              <Box alignItems="center" width="full">
                <ActionButton
                  color={accentColor}
                  label={i18n.t(i18n.l.points.referral.get_started)}
                  onPress={() => (isReadOnlyWallet ? watchingAlert() : navigate(Routes.CONSOLE_SHEET, { referralCode, deeplinked }))}
                />
              </Box>
            </Row>
          ) : (
            <Row height="content">
              <Box height={{ custom: 28 }} paddingHorizontal="20px" style={{ justifyContent: 'center' }}>
                <Columns>
                  <Column width="content">
                    <ButtonPressAnimation
                      onPress={() => {
                        setReferralCodeDisplay('');
                        setStatus('incomplete');
                        setDeeplinked(false);
                        setGoingBack(true);
                        goBack();
                      }}
                    >
                      <Text color={{ custom: accentColor }} size="20pt" weight="bold">
                        {`􀆉 ${i18n.t(i18n.l.points.referral.back)}`}
                      </Text>
                    </ButtonPressAnimation>
                  </Column>
                  <Box />
                </Columns>
              </Box>
            </Row>
          )}
        </Rows>
      </Box>
    </Box>
  );
}
