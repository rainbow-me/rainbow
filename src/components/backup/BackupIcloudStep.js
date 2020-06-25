import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, View } from 'react-native';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import zxcvbn from 'zxcvbn';
import WalletBackupTypes from '../../helpers/walletBackupTypes';
import { useWallets } from '../../hooks';
import * as keychain from '../../model/keychain';
import {
  addWalletToCloudBackup,
  backupWalletToCloud,
} from '../../model/wallet';
import { setWalletBackedUp } from '../../redux/wallets';
import { colors, padding } from '../../styles';
import { logger } from '../../utils';
import { RainbowButton } from '../buttons';
import { Icon } from '../icons';
import { Input } from '../inputs';
import { Centered, Column, Row } from '../layout';
import { SheetButton } from '../sheet';
import { GradientText, Text } from '../text';

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
  height: 150;
`;

const PasswordInput = styled(Input).attrs({
  blurOnSubmit: false,
  letterSpacing: 0.2,
  secureTextEntry: true,
  size: 'large',
  weight: 'normal',
})`
  padding-left: 19;
  padding-right: 40;
  padding-top: 15;
  padding-bottom: 15;
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

const ImportantText = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.5),
  lineHeight: 'looser',
  size: 'large',
  weight: '600',
})``;

const InfoIcon = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.15),
  lineHeight: 'looser',
  size: 'large',
})``;

const WarningIcon = () => (
  <IconWrapper>
    <Icon color={colors.yellowOrange} name="warningCircled" size={22} />
  </IconWrapper>
);
const GreenCheckmarkIcon = () => (
  <IconWrapper>
    <Icon color={colors.green} name="checkmarkCircled" size={22} />
  </IconWrapper>
);

const TopIcon = () => (
  <GradientText
    align="center"
    angle={false}
    letterSpacing="roundedTight"
    weight="bold"
    colors={['#FFB114', '#FF54BB', '#00F0FF']}
    end={{ x: 0, y: 0 }}
    start={{ x: 1, y: 1 }}
    steps={[0, 0.5, 1]}
    size={52}
  >
    <Text size={52}>􀌍</Text>
  </GradientText>
);

const BackupIcloudStep = () => {
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
    loadedPassword ? '􀙶 Add to iCloud Backup' : '􀙶 Confirm Backup'
  );
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();

  const onPasswordFocus = useCallback(() => {
    setPasswordFocused(true);
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
    if (passwordIsValid || (password === '' && confirmPassword === '')) {
      newLabel = loadedPassword ? '􀙶 Add to iCloud Backup' : '􀙶 Confirm Backup';
    } else if (
      password !== '' &&
      password.length < 8 &&
      passwordRef.current.isFocused()
    ) {
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
    let wallet_id =
      params?.wallet_id ||
      Object.keys(wallets).find(key => wallets[key].imported === false);

    try {
      logger.log('onConfirmBackup:: saving backup password', password);
      await keychain.saveBackupPassword(password);
      logger.log('onConfirmBackup:: saved');

      let backupFile;
      if (!latestBackup) {
        logger.log(
          'onConfirmBackup:: backing up to icloud',
          password,
          wallets[wallet_id]
        );

        backupFile = await backupWalletToCloud(password, wallets[wallet_id]);
      } else {
        logger.log(
          'onConfirmBackup:: adding to icloud backup',
          password,
          wallets[wallet_id],
          latestBackup
        );
        backupFile = await addWalletToCloudBackup(
          password,
          wallets[wallet_id],
          latestBackup
        );
      }
      if (backupFile) {
        logger.log('onConfirmBackup:: backup completed!', backupFile);
        await dispatch(
          setWalletBackedUp(wallet_id, WalletBackupTypes.cloud, backupFile)
        );
        logger.log(
          'onConfirmBackup:: backup saved in redux / keychain!',
          backupFile
        );

        logger.log(
          'onConfirmBackup:: backed up user data in the cloud!',
          backupFile
        );

        goBack();
      } else {
        Alert.alert('Error while trying to backup');
        setTimeout(onPasswordSubmit, 1000);
      }
    } catch (e) {
      logger.log('Error while backing up', e);
    }
  }, [
    params?.wallet_id,
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

  const onPressInfo = useCallback(() => null, []);

  return (
    <Centered direction="column">
      <Row paddingBottom={15} paddingTop={24}>
        <TopIcon />
      </Row>
      <Title>Choose a password</Title>
      <DescriptionText>
        Please use a password you&apos;ll remember.
        <ImportantText>&nbsp;It can&apos;t be recovered!</ImportantText>
        &nbsp;
        <InfoIcon onPress={onPressInfo}>􀅵</InfoIcon>
      </DescriptionText>
      <InputsWrapper>
        <Shadow>
          <PasswordInput
            placeholder="Backup Password"
            autoFocus
            onFocus={onPasswordFocus}
            onBlur={onPasswordBlur}
            onSubmitEditing={onPasswordSubmit}
            onChange={onPasswordChange}
            returnKeyType="next"
            ref={passwordRef}
            value={password}
          />
          {password.length >= 8 && <GreenCheckmarkIcon />}
          {password !== '' &&
            password.length < 8 &&
            !passwordRef.current.isFocused() && <WarningIcon />}
        </Shadow>
        <Shadow>
          <PasswordInput
            placeholder="Confirm Password"
            onChange={onConfirmPasswordChange}
            onSubmitEditing={onConfirmPasswordSubmit}
            returnKeyType="done"
            ref={confirmPasswordRef}
            value={confirmPassword}
          />
          {validPassword && <GreenCheckmarkIcon />}
          {confirmPassword !== '' &&
            confirmPassword.length >= 8 &&
            confirmPassword.length >= password.length &&
            confirmPassword !== password && <WarningIcon />}
        </Shadow>
      </InputsWrapper>
      <Column css={padding(19, 15, 30)} width="100%">
        {validPassword ? (
          <RainbowButton label={label} onPress={onConfirmBackup} />
        ) : (
          <SheetButton
            color={!validPassword && colors.grey}
            gradientBackground={validPassword}
            label={label}
            onPress={onConfirmBackup}
            disabled={!validPassword}
          />
        )}
      </Column>
    </Centered>
  );
};

export default BackupIcloudStep;
