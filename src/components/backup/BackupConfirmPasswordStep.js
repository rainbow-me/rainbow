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
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import WalletBackupTypes from '../../helpers/walletBackupTypes';
import WalletLoadingStates from '../../helpers/walletLoadingStates';
import { useWallets } from '../../hooks';
import { fetchBackupPassword, saveBackupPassword } from '../../model/keychain';
import {
  addWalletToCloudBackup,
  backupWalletToCloud,
} from '../../model/wallet';
import { isDoingSomething, setWalletBackedUp } from '../../redux/wallets';
import { borders, colors, padding } from '../../styles';
import { deviceUtils, logger } from '../../utils';
import { RainbowButton } from '../buttons';
import { Icon } from '../icons';
import { Input } from '../inputs';
import { Column, Row } from '../layout';
import { SheetButton } from '../sheet';
import { GradientText, Text } from '../text';

const sheetHeight = deviceUtils.dimensions.height - 200;

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

const WarningIcon = () => (
  <IconWrapper>
    <Icon color={colors.yellowOrange} name="warningCircled" size={22} />
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
    <Text size={52}>􀙶</Text>
  </GradientText>
);

const BackupConfirmPasswordStep = () => {
  const { goBack } = useNavigation();
  const { params } = useRoute();
  const dispatch = useDispatch();
  const [validPassword, setValidPassword] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(true);
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('􀙶 Confirm Backup');
  const passwordRef = useRef();
  const { latestBackup, wallets } = useWallets();

  useEffect(() => {
    const fetchPasswordIfPossible = async () => {
      const pwd = await fetchBackupPassword();
      if (pwd) {
        setPassword(pwd);
      }
    };

    fetchPasswordIfPossible();
  }, []);

  const onPasswordFocus = useCallback(() => {
    setPasswordFocused(true);
  }, []);

  const onPasswordBlur = useCallback(() => {
    setPasswordFocused(false);
  }, []);

  useEffect(() => {
    let newLabel = '';
    let passwordIsValid = false;

    if (incorrectPassword) {
      newLabel = 'Incorrect Password';
    } else {
      if (password !== '' && password.length >= 8) {
        passwordIsValid = true;
      }

      newLabel = `􀑙 Add to iCloud Backup`;
    }

    setValidPassword(passwordIsValid);
    setLabel(newLabel);
  }, [incorrectPassword, password, passwordFocused]);

  const onPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }) => {
      setPassword(inputText);
      setIncorrectPassword(false);
    },
    []
  );

  const onSubmit = useCallback(async () => {
    let wallet_id =
      params?.wallet_id ||
      Object.keys(wallets).find(key => wallets[key].imported === false);

    try {
      await dispatch(isDoingSomething(WalletLoadingStates.BACKING_UP_WALLET));
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
        await saveBackupPassword(password);
        logger.log('onConfirmBackup:: saving backup password', password);
        logger.log('onConfirmBackup:: saved');
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
      }
    } catch (e) {
      logger.log('Error while backing up', e);
      setTimeout(passwordRef.current.focus());
      await dispatch(isDoingSomething(null));
    }
  }, [dispatch, goBack, latestBackup, params?.wallet_id, password, wallets]);

  const onPasswordSubmit = useCallback(() => {
    validPassword && onSubmit();
  }, [onSubmit, validPassword]);

  return (
    <SheetContainer>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        enabled={Platform.OS !== 'android'}
        behavior="padding"
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
              {((password !== '' &&
                password.length < 8 &&
                !passwordRef.current.isFocused()) ||
                incorrectPassword) && <WarningIcon />}
            </Shadow>
          </InputsWrapper>
          <Column css={padding(0, 15, 0)} width="100%">
            {validPassword ? (
              <RainbowButton label={label} onPress={onPasswordSubmit} />
            ) : (
              <SheetButton
                color={!validPassword && colors.grey}
                gradientBackground={validPassword}
                label={label}
                onPress={onPasswordSubmit}
                disabled={!validPassword}
              />
            )}
          </Column>
        </Container>
      </KeyboardAvoidingView>
    </SheetContainer>
  );
};

export default BackupConfirmPasswordStep;
