import { useRoute } from '@react-navigation/native';
import * as lang from '@/languages';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { InteractionManager, Keyboard } from 'react-native';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { saveBackupPassword } from '../../model/backup';
import { cloudPlatform } from '../../utils/platform';
import { DelayedAlert } from '../alerts';
import { PasswordField } from '../fields';
import { Text } from '../text';
import WalletAndBackup from '@/assets/walletsAndBackup.png';
import { analytics } from '@/analytics';
import {
  cloudBackupPasswordMinLength,
  isCloudBackupPasswordValid,
} from '@/handlers/cloudBackup';
import {
  useDimensions,
  useMagicAutofocus,
  useRouteExistsInNavigationState,
  useWalletCloudBackup,
  useWallets,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { colors, padding } from '@/styles';
import logger from '@/utils/logger';
import { Box, Inset, Stack, useForegroundColor } from '@/design-system';
import { ImgixImage } from '../images';
import { IS_ANDROID } from '@/env';
import { KeyboardArea } from 'react-native-keyboard-area';
import { RainbowButton } from '../buttons';
import RainbowButtonTypes from '../buttons/rainbow-button/RainbowButtonTypes';

const DescriptionText = styled(Text).attrs(
  ({ theme: { colors }, color }: any) => ({
    align: 'left',
    color: color || colors.alpha(colors.blueGreyDark, 0.5),
    lineHeight: 'looser',
    size: 'lmedium',
    weight: 'medium',
  })
)({});

const KeyboardSizeView = styled(KeyboardArea)({
  backgroundColor: ({ theme: { colors } }: any) => colors.transparent,
});

const ImportantText = styled(DescriptionText).attrs(
  ({ theme: { colors } }: any) => ({
    color: colors.red,
    weight: 'bold',
  })
)({});

const Masthead = styled(Box).attrs({
  direction: 'column',
})({
  ...padding.object(0, 0, 16),
  gap: 8,
  flexShrink: 0,
});

const Title = styled(Text).attrs({
  size: 'big',
  weight: 'heavy',
})({
  ...padding.object(12, 0, 0),
});

const MIN_HEIGHT = 740;

export default function BackupCloudStep() {
  const { width: deviceWidth, height: deviceHeight } = useDimensions();

  const currentlyFocusedInput = useRef();
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const walletCloudBackup = useWalletCloudBackup();
  const { selectedWallet } = useWallets();
  const [validPassword, setValidPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { navigate } = useNavigation();

  const isSettingsRoute = useRouteExistsInNavigationState(
    Routes.SETTINGS_SHEET
  );

  const walletId = params?.walletId || selectedWallet.id;

  const labelDefaultColor = useForegroundColor('labelQuaternary');

  const [label, setLabel] = useState('');
  const [labelColor, setLabelColor] = useState(labelDefaultColor);
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();

  useEffect(() => {
    setTimeout(() => {
      passwordRef.current?.focus();
    }, 1);
    analytics.track('Choose Password Step', {
      category: 'backup',
      label: cloudPlatform,
    });
  }, []);

  const { handleFocus } = useMagicAutofocus(passwordRef);

  const onPasswordFocus = useCallback(
    target => {
      handleFocus(target);
      setPasswordFocused(true);
      currentlyFocusedInput.current = passwordRef.current;
    },
    [handleFocus]
  );

  const onConfirmPasswordFocus = useCallback(
    target => {
      handleFocus(target);
      currentlyFocusedInput.current = confirmPasswordRef.current;
    },
    [handleFocus]
  );

  const onPasswordBlur = useCallback(() => {
    setPasswordFocused(false);
  }, []);

  const onPasswordSubmit = useCallback(() => {
    confirmPasswordRef.current?.focus();
  }, []);

  useEffect(() => {
    let passwordIsValid = false;
    if (password === confirmPassword && isCloudBackupPasswordValid(password)) {
      passwordIsValid = true;
      setLabel(
        lang.t(lang.l.back_up.cloud.back_up_to_platform, {
          platform: cloudPlatform,
        })
      );
    }

    let newLabel = '';
    setLabelColor(labelDefaultColor);
    if (password.length < cloudBackupPasswordMinLength) {
      newLabel = lang.t('back_up.cloud.password.minimum_characters', {
        minimumLength: cloudBackupPasswordMinLength,
      });
    } else if (
      isCloudBackupPasswordValid(password) &&
      isCloudBackupPasswordValid(confirmPassword) &&
      confirmPassword.length >= password.length &&
      password !== confirmPassword
    ) {
      newLabel = lang.t(lang.l.back_up.cloud.password.passwords_dont_match);
      setLabelColor(colors.red);
    }

    setValidPassword(passwordIsValid);
    setLabel(newLabel);
  }, [confirmPassword, password, labelDefaultColor]);

  const onPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }) => {
      setPassword(inputText);
      setConfirmPassword('');
    },
    []
  );

  const onConfirmPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }) => {
      setConfirmPassword(inputText);
    },
    []
  );

  const onError = useCallback(
    msg => {
      setTimeout(onPasswordSubmit, 1000);
      DelayedAlert({ title: msg }, 500);
    },
    [onPasswordSubmit]
  );

  const onSuccess = useCallback(async () => {
    logger.log('BackupCloudStep:: saving backup password');
    await saveBackupPassword(password);
    if (!isSettingsRoute) {
      DelayedAlert({ title: lang.t(lang.l.cloud.backup_success) }, 1000);
    }
    // This means the user set a new password
    // and it was the first wallet backed up
    analytics.track('Backup Complete', {
      category: 'backup',
      label: cloudPlatform,
    });
    goBack();
  }, [goBack, isSettingsRoute, password]);

  const onConfirmBackup = useCallback(async () => {
    analytics.track('Tapped "Confirm Backup"');

    await walletCloudBackup({
      onError,
      onSuccess,
      password,
      walletId,
    });
  }, [onError, onSuccess, password, walletCloudBackup, walletId]);

  const showExplainerConfirmation = useCallback(async () => {
    android && Keyboard.dismiss();
    navigate(Routes.EXPLAIN_SHEET, {
      onClose: () => {
        InteractionManager.runAfterInteractions(() => {
          setTimeout(() => {
            onConfirmBackup();
          }, 300);
        });
      },
      type: 'backup',
    });
  }, [navigate, onConfirmBackup]);

  const onConfirmPasswordSubmit = useCallback(() => {
    validPassword && showExplainerConfirmation();
  }, [showExplainerConfirmation, validPassword]);

  return (
    <Box height={{ custom: deviceHeight - sharedCoolModalTopOffset - 48 }}>
      <Inset height="full" horizontal={'24px'}>
        <Stack alignHorizontal="left" space="8px">
          <Masthead>
            <Box
              as={ImgixImage}
              borderRadius={72 / 2}
              height={{ custom: 72 }}
              marginLeft={{ custom: -12 }}
              marginRight={{ custom: -12 }}
              marginTop={{ custom: 8 }}
              marginBottom={{ custom: -24 }}
              source={WalletAndBackup}
              width={{ custom: 72 }}
              size={72}
            />
            <Stack space="12px">
              <Title>
                {lang.t(lang.l.back_up.cloud.password.choose_a_password)}
              </Title>
              <DescriptionText>
                {lang.t(
                  lang.l.back_up.cloud.password
                    .a_password_youll_remember_part_one
                )}
                &nbsp;
                <ImportantText>
                  {lang.t(lang.l.back_up.cloud.password.not)}
                </ImportantText>
                &nbsp;
                {lang.t(
                  lang.l.back_up.cloud.password
                    .a_password_youll_remember_part_two
                )}
              </DescriptionText>
            </Stack>
          </Masthead>
          <Box gap={12}>
            <PasswordField
              key="password"
              isInvalid={
                password !== '' &&
                password.length < cloudBackupPasswordMinLength &&
                !passwordRef.current.isFocused()
              }
              isValid={isCloudBackupPasswordValid(password)}
              onBlur={onPasswordBlur}
              onChange={onPasswordChange}
              onFocus={onPasswordFocus}
              onSubmitEditing={onPasswordSubmit}
              password={password}
              placeholder={lang.t(
                lang.l.back_up.cloud.password.backup_password
              )}
              ref={passwordRef}
              returnKeyType="next"
              textContentType="newPassword"
            />
            {isCloudBackupPasswordValid(password) && (
              <PasswordField
                key="confirm-password"
                editable={isCloudBackupPasswordValid(password)}
                isInvalid={
                  isCloudBackupPasswordValid(confirmPassword) &&
                  confirmPassword.length >= password.length &&
                  confirmPassword !== password
                }
                isValid={validPassword}
                onChange={onConfirmPasswordChange}
                onFocus={onConfirmPasswordFocus}
                onSubmitEditing={onConfirmPasswordSubmit}
                password={confirmPassword}
                placeholder={lang.t(
                  lang.l.back_up.cloud.password.confirm_placeholder
                )}
                ref={confirmPasswordRef}
              />
            )}

            <DescriptionText color={labelColor}>{label}</DescriptionText>
          </Box>
        </Stack>

        <Box paddingTop="16px" justifyContent="flex-end">
          <RainbowButton
            height={46}
            width={deviceWidth - 48}
            disabled={!validPassword}
            type={RainbowButtonTypes.backup}
            label={`􀎽 ${lang.t(lang.l.back_up.cloud.back_up_to_platform, {
              cloudPlatformName: cloudPlatform,
            })}`}
            onPress={showExplainerConfirmation}
          />
          {IS_ANDROID ? <KeyboardSizeView /> : null}
        </Box>
      </Inset>
    </Box>
  );
}
