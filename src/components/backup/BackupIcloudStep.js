import React, { useCallback, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import { useDimensions } from '../../hooks';
import { colors, fonts, padding } from '../../styles';
import { Icon } from '../icons';
import { Input } from '../inputs';
import { Centered, ColumnWithMargins, Row } from '../layout';
import { SheetButton } from '../sheet';
import { GradientText, Text } from '../text';
const sx = StyleSheet.create({
  checkmarkIcon: {
    height: 22,
    position: 'absolute',
    right: 12,
    top: 12,
    width: 22,
  },
  inputs: {
    alignItems: 'center',
    height: 150,
  },
});

const TitleStyle = {
  fontSize: parseFloat(fonts.size.big),
  fontWeight: fonts.weight.bold,
};

const Title = p => <Text {...p} style={TitleStyle} />;

const BackupIcloudStep = () => {
  const { width: deviceWidth } = useDimensions();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();

  const isValidPassword = useCallback(() => {
    if (password === confirmPassword && password !== '') {
      return true;
    }
    return false;
  }, [confirmPassword, password]);

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
  const onConfirmBackup = useCallback(() => {
    console.log('icloud backup');
  }, []);
  const onPressInfo = useCallback(() => {
    console.log('info');
  }, []);

  const validPassword = isValidPassword();

  return (
    <Centered direction="column" paddingTop={9} paddingBottom={0}>
      <Row marginBottom={12} marginTop={15}>
        <GradientText
          align="center"
          angle={false}
          letterSpacing="roundedTight"
          weight="bold"
          colors={['#FFB114', '#FF54BB', '#00F0FF']}
          end={{ x: 0, y: 0 }}
          start={{ x: 1, y: 1 }}
          steps={[0, 0.5, 1]}
        >
          <Text size={52}>􀙶</Text>
        </GradientText>
      </Row>
      <Row marginBottom={12}>
        <Title>Choose a password</Title>
      </Row>
      <Text
        align="center"
        color={colors.alpha(colors.blueGreyDark, 0.5)}
        lineHeight="looser"
        size="large"
        style={{ paddingBottom: 30, paddingHorizontal: 50 }}
      >
        Please use a password you&apos;ll remember.
        <Text
          weight="500"
          size="large"
          color={colors.alpha(colors.blueGreyDark, 0.5)}
          lineHeight="looser"
        >
          &nbsp;It can&apos;t be recovered!
        </Text>
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.15)}
          lineHeight="looser"
          size="large"
          onPress={onPressInfo}
        >
          &nbsp;􀅵
        </Text>
      </Text>
      <View style={sx.inputs}>
        <ShadowStack
          height={49}
          width={deviceWidth - 130}
          borderRadius={16}
          shadows={[
            [0, 10, 30, colors.dark, 0.1],
            [0, 5, 15, colors.dark, 0.04],
          ]}
          style={{ elevation: 15, marginBottom: 19 }}
        >
          <Input
            placeholder="Password"
            autoFocus
            letterSpacing={0.2}
            onChange={onPasswordChange}
            returnKeyType="done"
            size="large"
            ref={passwordRef}
            style={{ paddingHorizontal: 19, paddingVertical: 15 }}
            value={password}
            weight="normal"
            secureTextEntry
          />
          {validPassword && (
            <View style={sx.checkmarkIcon}>
              <Icon color={colors.green} name="checkmarkCircled" size={22} />
            </View>
          )}
        </ShadowStack>
        <ShadowStack
          height={49}
          width={deviceWidth - 130}
          borderRadius={16}
          shadows={[
            [0, 10, 30, colors.dark, 0.1],
            [0, 5, 15, colors.dark, 0.04],
          ]}
          style={{ elevation: 15 }}
        >
          <Input
            autoFocus
            placeholder="Confirm Password"
            letterSpacing={0.2}
            onChange={onConfirmPasswordChange}
            returnKeyType="done"
            size="large"
            ref={confirmPasswordRef}
            style={{ paddingHorizontal: 19, paddingVertical: 15 }}
            value={confirmPassword}
            weight="normal"
            secureTextEntry
          />
          {validPassword && (
            <View style={sx.checkmarkIcon}>
              <Icon color={colors.green} name="checkmarkCircled" size={22} />
            </View>
          )}
        </ShadowStack>
      </View>
      <ColumnWithMargins css={padding(19, 15, 0)} margin={19} width="100%">
        <SheetButton
          color={validPassword ? colors.swapPurple : colors.grey}
          label="􀙶 Confirm Backup"
          onPress={onConfirmBackup}
          disabled={!validPassword}
          shadows={[
            [0, 10, 30, colors.dark, 0.2],
            [0, 5, 15, validPassword ? colors.swapPurple : colors.grey, 0.4],
          ]}
        />
      </ColumnWithMargins>
    </Centered>
  );
};

export default BackupIcloudStep;
