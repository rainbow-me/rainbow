import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  View,
} from 'react-native';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import styled from 'styled-components';
import { isCloudBackupPasswordValid } from '../../handlers/cloudBackup';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import { saveBackupPassword } from '../../model/backup';
import { deviceUtils } from '../../utils';
import { RainbowButton } from '../buttons';
import { Icon } from '../icons';
import { Input } from '../inputs';
import { Column, Row } from '../layout';
import { GradientText, Text } from '../text';
import {
  useRouteExistsInNavigationState,
  useWalletCloudBackup,
  useWallets,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { borders, colors, padding } from '@rainbow-me/styles';
import logger from 'logger';

const sheetHeight = deviceUtils.dimensions.height - 108;

const SheetContainer = isNativeStackAvailable
  ? styled(Column)`
      background-color: ${colors.white};
      height: ${sheetHeight};
    `
  : styled(Column)`
      ${borders.buildRadius('top', 16)};
      background-color: ${colors.white};
      height: 100%;
    `;

const Container = styled(Column)`
  background-color: ${colors.transparent};
  height: 100%;
`;

const Shadow = styled(ShadowStack).attrs({
  borderRadius: 16,
  height: 49,
  shadows: [
    [0, 10, 30, colors.dark, 0.1],
    [0, 5, 15, colors.dark, 0.04],
  ],
  width: Dimensions.get('window').width - 130,
})`
  elevation: 15;
  margin-bottom: 19;
`;

const InputsWrapper = styled(View)`
  align-items: center;
  height: 120;
`;

const PasswordInput = styled(Input).attrs({
  blurOnSubmit: false,
  letterSpacing: 0.2,
  secureTextEntry: true,
  size: 'large',
  weight: 'normal',
})`
  padding-bottom: 15;
  padding-left: 19;
  padding-right: 40;
  padding-top: 15;
`;

const IconWrapper = styled(View)`
  margin-bottom: 12;
  height: 22;
  position: absolute;
  right: 12;
  top: 12;
  width: 22;
`;

const Title = styled(Text).attrs({
  size: 'big',
  weight: 'bold',
})`
  margin-bottom: 12;
`;

const DescriptionText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'large',
})`
  padding-bottom: 30;
  padding-left: 50;
  padding-right: 50;
`;

const WarningIcon = () => (
  <IconWrapper>
    <Icon color={colors.orangeLight} name="warningCircled" size={22} />
  </IconWrapper>
);

const TopIcon = () => (
  <GradientText
    align="center"
    angle={false}
    colors={['#FFB114', '#FF54BB', '#00F0FF']}
    end={{ x: 0, y: 0 }}
    letterSpacing="roundedTight"
    size={52}
    start={{ x: 1, y: 1 }}
    steps={[0, 0.5, 1]}
    weight="bold"
  >
    <Text size={52}>􀙶</Text>
  </GradientText>
);

export default function BackupConfirmPasswordStep() {
  const { params } = useRoute();
  const walletCloudBackup = useWalletCloudBackup();
  const [validPassword, setValidPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(true);
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('􀎽 Confirm Backup');
  const passwordRef = useRef();
  const { selectedWallet, setIsWalletLoading } = useWallets();

  const isSettingsRoute = useRouteExistsInNavigationState(
    Routes.SETTINGS_MODAL
  );

  const walletId = params?.walletId || selectedWallet.id;
  const { goBack } = useNavigation();

  useEffect(() => {
    analytics.track('Confirm Password Step', {
      category: 'backup',
      label: 'icloud',
    });
  }, []);

  const onPasswordFocus = useCallback(() => {
    setPasswordFocused(true);
  }, []);

  const onPasswordBlur = useCallback(() => {
    setPasswordFocused(false);
  }, []);

  useEffect(() => {
    let passwordIsValid = false;

    if (isCloudBackupPasswordValid(password)) {
      passwordIsValid = true;
      setLabel(`􀑙 Add to iCloud Backup`);
    }
    setValidPassword(passwordIsValid);
  }, [password, passwordFocused]);

  const onPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }) => {
      setPassword(inputText);
    },
    []
  );

  const onError = useCallback(
    msg => {
      passwordRef.current?.focus();
      setIsWalletLoading(null);
      setTimeout(() => {
        Alert.alert(msg);
      }, 500);
    },
    [setIsWalletLoading]
  );

  const onSuccess = useCallback(async () => {
    logger.log('BackupConfirmPasswordStep:: saving backup password');
    await saveBackupPassword(password);
    if (!isSettingsRoute) {
      setTimeout(() => {
        Alert.alert(lang.t('icloud.backup_success'));
      }, 1000);
    }
    // This means the user didn't have the password saved
    // and at least an other wallet already backed up
    analytics.track('Backup Complete via Confirm Step', {
      category: 'backup',
      label: 'icloud',
    });
    goBack();
  }, [goBack, isSettingsRoute, password]);

  const onSubmit = useCallback(async () => {
    await walletCloudBackup({
      onError,
      onSuccess,
      password,
      walletId,
    });
  }, [onError, onSuccess, password, walletCloudBackup, walletId]);

  const onPasswordSubmit = useCallback(() => {
    validPassword && onSubmit();
  }, [onSubmit, validPassword]);

  return (
    <SheetContainer>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior="padding"
        enabled={Platform.OS !== 'android'}
      >
        <Container align="center">
          <Row paddingBottom={15} paddingTop={24}>
            <TopIcon />
          </Row>
          <Title>Enter backup password</Title>
          <DescriptionText>
            To add your wallet to the iCloud backup, enter the backup password
          </DescriptionText>
          <InputsWrapper>
            <Shadow>
              <PasswordInput
                autoFocus
                onBlur={onPasswordBlur}
                onChange={onPasswordChange}
                onFocus={onPasswordFocus}
                onSubmitEditing={onPasswordSubmit}
                placeholder="Backup Password"
                ref={passwordRef}
                returnKeyType="next"
                value={password}
              />
              {password !== '' &&
                password.length < 8 &&
                !passwordRef.current.isFocused() && <WarningIcon />}
            </Shadow>
          </InputsWrapper>
          <Column css={padding(0, 15, 0)} width="100%">
            <RainbowButton
              disabled={!validPassword}
              label={label}
              onPress={onPasswordSubmit}
            />
          </Column>
        </Container>
      </KeyboardAvoidingView>
    </SheetContainer>
  );
}
