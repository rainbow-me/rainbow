import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  View,
} from 'react-native';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import styled from 'styled-components';
import { isCloudBackupPasswordValid } from '../../handlers/cloudBackup';
import { removeWalletData } from '../../handlers/localstorage/removeWallet';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';
import WalletLoadingStates from '../../helpers/walletLoadingStates';
import { useAccountSettings, useWallets } from '../../hooks';
import {
  fetchBackupPassword,
  restoreCloudBackup,
  saveBackupPassword,
} from '../../model/backup';
import { sheetVerticalOffset } from '../../navigation/effects';
import { usePortal } from '../../react-native-cool-modals/Portal';
import { deviceUtils } from '../../utils';
import { RainbowButton } from '../buttons';
import { Icon } from '../icons';
import { Input } from '../inputs';
import { Column, Row } from '../layout';
import LoadingOverlay from '../modal/LoadingOverlay';
import { GradientText, Text } from '../text';
import Routes from '@rainbow-me/routes';
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

export default function RestoreIcloudStep({ userData }) {
  const { goBack, replace } = useNavigation();
  const { isWalletLoading, setIsWalletLoading } = useWallets();
  const { accountAddress } = useAccountSettings();
  const [validPassword, setValidPassword] = useState(false);
  const [incorrectPassword, setIncorrectPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('􀎽 Confirm Backup');
  const passwordRef = useRef();
  const { setComponent, hide } = usePortal();

  useEffect(() => {
    if (isWalletLoading) {
      setComponent(
        <LoadingOverlay
          paddingTop={sheetVerticalOffset}
          title={isWalletLoading}
        />,
        false
      );
    }
    return hide;
  }, [hide, isWalletLoading, setComponent]);

  useEffect(() => {
    const fetchPasswordIfPossible = async () => {
      const pwd = await fetchBackupPassword();
      if (pwd) {
        setPassword(pwd);
      }
    };
    fetchPasswordIfPossible();
  }, []);

  useEffect(() => {
    let newLabel = '';
    let passwordIsValid = false;

    if (incorrectPassword) {
      newLabel = 'Incorrect Password';
    } else {
      if (isCloudBackupPasswordValid(password)) {
        passwordIsValid = true;
      }

      newLabel = `􀑙 Restore from iCloud`;
    }

    setValidPassword(passwordIsValid);
    setLabel(newLabel);
  }, [incorrectPassword, password]);

  const onPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }) => {
      setPassword(inputText);
      setIncorrectPassword(false);
    },
    []
  );

  const onSubmit = useCallback(async () => {
    try {
      setIsWalletLoading(WalletLoadingStates.RESTORING_WALLET);
      const success = await restoreCloudBackup(password, userData);
      if (success) {
        // Store it in the keychain in case it was missing
        await saveBackupPassword(password);
        // Get rid of the current wallet
        await removeWalletData(accountAddress);
        goBack();
        InteractionManager.runAfterInteractions(async () => {
          replace(Routes.SWIPE_LAYOUT);
          setIsWalletLoading(null);
        });
      } else {
        setIncorrectPassword(true);
        setIsWalletLoading(null);
      }
    } catch (e) {
      setIsWalletLoading(null);
      Alert.alert('Error while restoring backup');
    }
  }, [accountAddress, goBack, password, replace, setIsWalletLoading, userData]);

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
            To restore your wallet, enter the backup password you created
          </DescriptionText>
          <InputsWrapper>
            <Shadow>
              <PasswordInput
                autoFocus
                onChange={onPasswordChange}
                onSubmitEditing={onPasswordSubmit}
                placeholder="Backup Password"
                ref={passwordRef}
                returnKeyType="next"
                value={password}
              />
              {((password !== '' &&
                password.length < 8 &&
                !passwordRef.current.isFocused()) ||
                incorrectPassword) && <WarningIcon />}
            </Shadow>
          </InputsWrapper>
          <Column css={padding(0, 15, 30)} width="100%">
            <RainbowButton
              disabled={!validPassword}
              label={label}
              onPress={onSubmit}
            />
          </Column>
        </Container>
      </KeyboardAvoidingView>
    </SheetContainer>
  );
}
