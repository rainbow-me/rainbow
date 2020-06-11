import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, View } from 'react-native';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components';
import * as keychain from '../../model/keychain';
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

const RestoreIcloudStep = () => {
  const { goBack } = useNavigation();
  const [validPassword, setValidPassword] = useState(false);
  const [invalidPassword, setInvalidPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(true);
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('􀙶 Confirm Backup');
  const passwordRef = useRef();

  const onPasswordFocus = useCallback(() => {
    setPasswordFocused(true);
  }, []);

  const onPasswordBlur = useCallback(() => {
    setPasswordFocused(false);
  }, []);

  useEffect(() => {
    let newLabel = '';
    let passwordIsValid = false;

    if (invalidPassword) {
      newLabel = 'Incorrect Password';
    } else {
      if (password !== '' && password.length >= 8) {
        passwordIsValid = true;
      }

      if (passwordIsValid || password === '') {
        newLabel = `􀑙 Restore with iCloud`;
      }
    }

    setValidPassword(passwordIsValid);
    setLabel(newLabel);
  }, [invalidPassword, password, passwordFocused]);

  const onPasswordChange = useCallback(
    ({ nativeEvent: { text: inputText } }) => {
      setPassword(inputText);
    },
    []
  );

  const onSubmit = useCallback(async () => {
    try {
      const success = await keychain.restoreCloudBackup(password);
      if (success) {
        goBack();
        Alert.alert('Your wallet has been restored!');
      } else {
        setInvalidPassword(true);
        Alert.alert('Error while trying to restore');
        setTimeout(passwordRef.current?.focus(), 1000);
      }
    } catch (e) {
      logger.log('Error while backing up', e);
    }
  }, [goBack, password]);

  const onPasswordSubmit = useCallback(() => {
    validPassword && onSubmit();
  }, [onSubmit, validPassword]);

  return (
    <Centered direction="column">
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
            invalidPassword) && <WarningIcon />}
        </Shadow>
      </InputsWrapper>
      <Column css={padding(0, 15, 30)} width="100%">
        {validPassword ? (
          <RainbowButton label={label} onPress={onSubmit} />
        ) : (
          <SheetButton
            color={!validPassword && colors.grey}
            gradientBackground={validPassword}
            label={label}
            onPress={onSubmit}
            disabled={!validPassword}
          />
        )}
      </Column>
    </Centered>
  );
};

export default RestoreIcloudStep;
