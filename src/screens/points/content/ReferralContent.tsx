import { ButtonPressAnimation } from '@/components/animations';
import { navbarHeight } from '@/components/navbar/Navbar';
import {
  Bleed,
  Box,
  Inline,
  Stack,
  Text,
  useForegroundColor,
  useTextStyle,
} from '@/design-system';
import { IS_IOS } from '@/env';
import { metadataPOSTClient } from '@/graphql';
import {
  useAccountAccentColor,
  useDimensions,
  useKeyboardHeight,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import { getHeaderHeight } from '@/navigation/SwipeNavigator';
import { haptics } from '@/utils';
import { delay } from '@/utils/delay';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { Keyboard, TextInput } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { WrappedAlert as Alert } from '@/helpers/alert';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { PointsErrorType } from '@/graphql/__generated__/metadata';
import { RainbowError, logger } from '@/logger';
import { ActionButton } from '@/screens/points/components/ActionButton';
import { PointsIconAnimation } from '../components/PointsIconAnimation';

export default function ReferralContent() {
  const { accentColor } = useAccountAccentColor();
  const { goBack, navigate } = useNavigation();

  const { height: deviceHeight } = useDimensions();
  const keyboardHeight = useKeyboardHeight();

  const [referralCodeDisplay, setReferralCodeDisplay] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [status, setStatus] = useState<'incomplete' | 'valid' | 'invalid'>(
    'incomplete'
  );

  const textInputRef = React.useRef<TextInput>(null);

  const validateReferralCode = useCallback(async (code: string) => {
    if (code.length !== 6) return;
    const res = await metadataPOSTClient.validateReferral({
      code,
    });
    if (!res?.validateReferral?.valid) {
      if (
        res.validateReferral?.error?.type ===
        PointsErrorType.InvalidReferralCode
      ) {
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
      setReferralCode(code);
      textInputRef.current?.blur();
      haptics.notificationSuccess();
    }
  }, []);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isKeyboardOpening, setIsKeyboardOpening] = useState(false);

  const hasKeyboard = IS_IOS ? isKeyboardOpening : isKeyboardVisible;

  const contentBottom =
    (hasKeyboard ? keyboardHeight : getHeaderHeight()) +
    (deviceHeight - (hasKeyboard ? keyboardHeight : 0) - navbarHeight - 270) /
      2;

  const contentBottomSharedValue = useSharedValue(contentBottom);

  useEffect(() => {
    contentBottomSharedValue.value = withTiming(contentBottom);
  }, [contentBottom, contentBottomSharedValue]);

  useFocusEffect(
    useCallback(() => {
      delay(400).then(() => textInputRef.current?.focus());

      return () => {
        setReferralCodeDisplay('');
        setStatus('incomplete');
      };
    }, [])
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
      }
    );
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      () => {
        setIsKeyboardOpening(true);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setIsKeyboardOpening(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
      keyboardWillHideListener.remove();
      keyboardWillShowListener.remove();
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      bottom: contentBottomSharedValue.value,
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
    (code: string) => {
      const rawCode = code.replace(/-/g, '').slice(0, 6).toLocaleUpperCase();
      let formattedCode = rawCode;

      // If the user backspaces over the hyphen, remove the character before the hyphen
      if (referralCodeDisplay.length === 4 && code.length === 3) {
        formattedCode = formattedCode.slice(0, -1);
      }

      // Insert "-" after the 3rd character if the length is 4 or more
      if (formattedCode.length >= 3) {
        formattedCode =
          formattedCode.slice(0, 3) + '-' + formattedCode.slice(3, 7);
      }

      // Update the state and the input
      setReferralCodeDisplay(formattedCode); // Limit to 6 characters + '-'

      if (formattedCode.length !== 7) {
        setStatus('incomplete');
      } else {
        validateReferralCode(rawCode);
      }
    },
    [referralCodeDisplay.length, validateReferralCode]
  );

  return (
    <Box
      background="surfacePrimary"
      height="full"
      justifyContent="flex-end"
      alignItems="center"
      paddingBottom={{ custom: 134 }}
    >
      <Box
        as={Animated.View}
        position="absolute"
        paddingHorizontal="60px"
        style={animatedStyle}
      >
        <Stack space={{ custom: 16.5 }}>
          <Stack space="32px" alignHorizontal="center">
            <Stack space="20px" alignHorizontal="center">
              <Stack space="28px" alignHorizontal="center">
                <PointsIconAnimation />
                <Text size="22pt" weight="heavy" align="center" color="label">
                  {i18n.t(i18n.l.points.referral.title)}
                </Text>
              </Stack>
              <Text
                size="15pt"
                weight="semibold"
                align="center"
                color="labelTertiary"
              >
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
                    ...(IS_IOS ? inputTextStyle : {}),
                  }}
                  autoFocus={false}
                  maxLength={7}
                  selectionColor={statusColor}
                  textAlign="left"
                  autoCapitalize="characters"
                  placeholder="XXX-XXX"
                  onChangeText={onChangeText}
                />
                {status === 'valid' && (
                  <Bleed horizontal="2px">
                    <Text
                      weight="heavy"
                      size="17pt"
                      align="center"
                      color={{ custom: accentColor }}
                    >
                      􀁣
                    </Text>
                  </Bleed>
                )}
              </Inline>
            </Box>
          </Stack>
          <Text
            size="13pt"
            weight="heavy"
            align="center"
            color={{ custom: status === 'invalid' ? red : 'transparent' }}
          >
            {i18n.t(i18n.l.points.referral.invalid_code)}
          </Text>
        </Stack>
      </Box>
      {hasKeyboard && (
        <Box
          position="absolute"
          bottom={{
            custom: keyboardHeight + 28,
          }}
          left={{ custom: 20 }}
        >
          <ButtonPressAnimation onPress={goBack}>
            <Text color={{ custom: accentColor }} size="20pt" weight="bold">
              {`􀆉 ${i18n.t(i18n.l.points.referral.back)}`}
            </Text>
          </ButtonPressAnimation>
        </Box>
      )}
      {!hasKeyboard && status === 'valid' && (
        <ActionButton
          color={accentColor}
          label={i18n.t(i18n.l.points.referral.get_started)}
          onPress={() => navigate(Routes.CONSOLE_SHEET, { referralCode })}
        />
      )}
    </Box>
  );
}
