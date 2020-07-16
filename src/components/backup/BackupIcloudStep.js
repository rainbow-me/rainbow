import { useNavigation, useRoute } from '@react-navigation/native';
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
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import zxcvbn from 'zxcvbn';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import WalletBackupTypes from '../../helpers/walletBackupTypes';
import WalletLoadingStates from '../../helpers/walletLoadingStates';
import { useWallets } from '../../hooks';
import * as keychain from '../../model/keychain';
import {
  addWalletToCloudBackup,
  backupWalletToCloud,
} from '../../model/wallet';
import { setIsWalletLoading, setWalletBackedUp } from '../../redux/wallets';
import { deviceUtils, logger } from '../../utils';
import { RainbowButton } from '../buttons';
import { Icon } from '../icons';
import { Input } from '../inputs';
import { Column, Row } from '../layout';
import { GradientText, Text } from '../text';
import { borders, colors, padding } from '@rainbow-me/styles';

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
  borderRadius: 23,
  height: 46,
  shadows: [
    [0, 5, 15, colors.dark, 0.06],
    [0, 10, 30, colors.dark, 0.12],
  ],
  width: Dimensions.get('window').width - 130,
})`
  elevation: 15;
  margin-bottom: 19;
`;

const InputsWrapper = styled(View)`
  align-items: center;
  height: 111;
`;

const PasswordInput = styled(Input).attrs({
  blurOnSubmit: false,
  placeholderTextColor: colors.alpha(colors.blueGreyDark, 0.4),
  secureTextEntry: true,
  size: 'large',
  type: 'password',
  weight: 'semibold',
})`
  padding-left: 19;
  padding-right: 46;
  padding-top: 11;
`;

const IconWrapper = styled(View)`
  height: 22;
  margin-bottom: 12;
  position: absolute;
  right: 12;
  top: 12;
  width: 22;
`;

const Title = styled(Text).attrs({
  size: 'big',
  weight: 'bold',
})`
  margin-bottom: 10;
`;

const DescriptionText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'large',
})`
  padding-bottom: 39;
  padding-left: 50;
  padding-right: 50;
`;

const ImportantText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  lineHeight: 'looser',
  size: 'large',
  weight: 'medium',
})``;

// const InfoIcon = styled(Text).attrs({
//   align: 'center',
//   color: colors.alpha(colors.blueGreyDark, 0.15),
//   lineHeight: 'looser',
//   size: 'large',
// })``;

const WarningIcon = () => (
  <IconWrapper>
    <Icon color={colors.orangeLight} name="warningCircled" size={22} />
  </IconWrapper>
);
const GreenCheckmarkIcon = () => (
  <IconWrapper>
    <Icon color={colors.green} name="checkmarkCircled" size={22} />
  </IconWrapper>
);

const TopIcon = () => (
  <GradientText
    angle={false}
    colors={['#FFB114', '#FF54BB', '#7EA4DE']}
    end={{ x: 0, y: 0.5 }}
    start={{ x: 1, y: 0.5 }}
    steps={[0, 0.774321, 1]}
  >
    <Text align="center" size={43} weight="medium">
      􀌍
    </Text>
  </GradientText>
);

const BackupIcloudStep = ({ setAppearListener }) => {
  const currentlyFocusedInput = useRef();
  const refocus = useCallback(() => {
    currentlyFocusedInput.current?.focus();
  }, []);
  useEffect(() => {
    setAppearListener(refocus);
  }, [setAppearListener, refocus]);
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const loadedPassword = params?.password || '';
  const { latestBackup, wallets } = useWallets();
  const dispatch = useDispatch();
  const [validPassword, setValidPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(true);
  const [password, setPassword] = useState(loadedPassword);
  const [confirmPassword, setConfirmPassword] = useState(loadedPassword);

  const [label, setLabel] = useState(
    !validPassword ? '􀙶 Add to iCloud Backup' : '􀎽 Confirm Backup'
  );
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();

  useEffect(() => {
    setTimeout(() => {
      passwordRef.current?.focus();
    }, 1);
  }, []);

  const onPasswordFocus = useCallback(() => {
    setPasswordFocused(true);
    currentlyFocusedInput.current = passwordRef.current;
  }, []);

  const onConfirmPasswordFocus = useCallback(() => {
    currentlyFocusedInput.current = confirmPasswordRef.current;
  }, []);

  const onPasswordBlur = useCallback(() => {
    setPasswordFocused(false);
  }, []);

  const onPasswordSubmit = useCallback(() => {
    confirmPasswordRef.current.focus();
  }, []);

  useEffect(() => {
    let passwordIsValid = false;
    if (
      password === confirmPassword &&
      password !== '' &&
      password.length >= 8
    ) {
      passwordIsValid = true;
    }

    let newLabel = '';
    if (passwordIsValid) {
      newLabel = loadedPassword ? '􀙶 Add to iCloud Backup' : '􀎽 Confirm Backup';
    } else if (password.length < 8) {
      newLabel = 'Minimum 8 characters';
    } else if (
      password !== '' &&
      password.length < 8 &&
      !passwordRef.current.isFocused()
    ) {
      newLabel = 'Use a longer password';
    } else if (
      password.length >= 8 &&
      confirmPassword.length >= 8 &&
      confirmPassword.length >= password.length &&
      password !== confirmPassword
    ) {
      newLabel = `Passwords don't match`;
    } else if (password.length >= 8 && !passwordFocused) {
      newLabel = 'Confirm password';
    } else if (password.length >= 8 && passwordFocused) {
      const passInfo = zxcvbn(password);
      switch (passInfo.score) {
        case 0:
        case 1:
          newLabel = '💩 Weak password';
          break;
        case 2:
          newLabel = '💪 Good password';
          break;
        case 3:
          newLabel = '🦾 Great password';
          break;
        case 4:
          newLabel = '🏰️ Strong password';
          break;
        default:
      }
    }

    setValidPassword(passwordIsValid);
    setLabel(newLabel);
  }, [confirmPassword, loadedPassword, password, passwordFocused]);

  const onPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }) => {
      setPassword(inputText);
    },
    []
  );

  const onConfirmPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }) => {
      setConfirmPassword(inputText);
    },
    []
  );
  const onConfirmBackup = useCallback(async () => {
    let walletId =
      params?.walletId ||
      Object.keys(wallets).find(key => wallets[key].imported === false);

    try {
      await dispatch(setIsWalletLoading(WalletLoadingStates.BACKING_UP_WALLET));

      let backupFile;
      if (!latestBackup) {
        logger.log(
          'BackupIcloudStep:: backing up to icloud',
          wallets[walletId]
        );

        backupFile = await backupWalletToCloud(password, wallets[walletId]);
      } else {
        logger.log(
          'BackupIcloudStep:: adding to icloud backup',
          wallets[walletId],
          latestBackup
        );
        backupFile = await addWalletToCloudBackup(
          password,
          wallets[walletId],
          latestBackup
        );
      }
      if (backupFile) {
        logger.log('BackupIcloudStep:: saving backup password');
        await keychain.saveBackupPassword(password);
        logger.log('BackupIcloudStep:: saved');

        logger.log('BackupIcloudStep:: backup completed!', backupFile);
        await dispatch(
          setWalletBackedUp(walletId, WalletBackupTypes.cloud, backupFile)
        );
        logger.log('BackupIcloudStep:: backup saved everywhere!');
        goBack();
      } else {
        Alert.alert('Error while trying to backup');
        setTimeout(onPasswordSubmit, 1000);
        dispatch(setIsWalletLoading(null));
      }
    } catch (e) {
      logger.log('Error while backing up', e);
      dispatch(setIsWalletLoading(null));
      Alert.alert('Error while trying to backup');
    }
  }, [
    params?.walletId,
    wallets,
    password,
    latestBackup,
    dispatch,
    goBack,
    onPasswordSubmit,
  ]);

  const onConfirmPasswordSubmit = useCallback(() => {
    validPassword && onConfirmBackup();
  }, [onConfirmBackup, validPassword]);

  // const onPressInfo = useCallback(() => null, []);

  return (
    <SheetContainer>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior="padding"
        enabled={Platform.OS !== 'android'}
      >
        <Container align="center">
          <Row paddingBottom={15} paddingTop={9}>
            <TopIcon />
          </Row>
          <Title>Choose a password</Title>
          <DescriptionText>
            Please use a password you&apos;ll remember.
            <ImportantText>&nbsp;It can&apos;t be recovered!</ImportantText>
            &nbsp;
            {/* <InfoIcon onPress={onPressInfo}>􀅵</InfoIcon> */}
          </DescriptionText>
          <InputsWrapper>
            <Shadow>
              <PasswordInput
                onBlur={onPasswordBlur}
                onChange={onPasswordChange}
                onFocus={onPasswordFocus}
                onSubmitEditing={onPasswordSubmit}
                placeholder="Backup Password"
                ref={passwordRef}
                returnKeyType="next"
                value={password}
              />
              {password.length >= 8 && <GreenCheckmarkIcon />}
              {password !== '' &&
                password.length < 8 &&
                !passwordRef.current.isFocused() && <WarningIcon />}
            </Shadow>
            <Shadow>
              <PasswordInput
                onChange={onConfirmPasswordChange}
                onFocus={onConfirmPasswordFocus}
                onSubmitEditing={onConfirmPasswordSubmit}
                placeholder="Confirm Password"
                ref={confirmPasswordRef}
                returnKeyType="done"
                value={confirmPassword}
              />
              {validPassword && <GreenCheckmarkIcon />}
              {confirmPassword !== '' &&
                confirmPassword.length >= 8 &&
                confirmPassword.length >= password.length &&
                confirmPassword !== password && <WarningIcon />}
            </Shadow>
          </InputsWrapper>
          <Column css={padding(49, 15, 40)} width="100%">
            <RainbowButton
              disabled={!validPassword}
              label={label}
              onPress={onConfirmBackup}
            />
          </Column>
        </Container>
      </KeyboardAvoidingView>
    </SheetContainer>
  );
};

export default BackupIcloudStep;
