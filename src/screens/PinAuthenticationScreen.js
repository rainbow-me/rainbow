import { useRoute } from '@react-navigation/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import RainbowLogo from '../assets/rainbows/light.png';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
import { Numpad, PinValue } from '../components/numpad';
import { SheetTitle } from '../components/sheet';
import {
  getAuthTimelock,
  saveAuthTimelock,
} from '../handlers/localstorage/globalSettings';
import { useDimensions, useShakeAnimation } from '../hooks';
import { useNavigation } from '../navigation/Navigation';
import { colors, padding } from '@rainbow-me/styles';
const Logo = styled(FastImage).attrs({
  source: RainbowLogo,
})`
  width: 80;
  height: 80;
`;

const MAX_ATTEMPTS_LEFT = 10;
const TIMELOCK_INTERVAL_MINUTES = 1;

const PinAuthenticationScreen = () => {
  const { params } = useRoute();
  const { goBack, setParams } = useNavigation();
  const [errorAnimation, onShake] = useShakeAnimation();

  const { isNarrowPhone, isSmallPhone, isTallPhone } = useDimensions();

  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS_LEFT);
  const [value, setValue] = useState('');
  const [initialPin, setInitialPin] = useState('');
  const [actionType, setActionType] = useState(
    params.validPin ? 'authentication' : 'creation'
  );

  const finished = useRef(false);

  useEffect(() => {
    return () => {
      if (!finished.current) {
        params.onCancel();
      }
    };
  }, [params, setParams]);

  useEffect(() => {
    const checkTimelock = async () => {
      // When opening the screen we need to check
      // if the user wasn't banned for too many tries
      const timelock = await getAuthTimelock();
      console.log('timelock', timelock);
      if (timelock) {
        const stillBanned = Date.now() < timelock;
        console.log('stillBanned', stillBanned);
        if (stillBanned) {
          const timeLeftMS = Date.now() - timelock;
          const timeAmountSeconds = Math.abs(timeLeftMS / 1000);
          const unit = timeAmountSeconds > 60 ? 'minutes' : 'seconds';
          const timeAmount =
            timeAmountSeconds > 60
              ? Math.ceil(timeAmountSeconds / 60)
              : Math.ceil(timeAmountSeconds);
          console.log('Data', {
            timeAmount,
            timeAmountSeconds,
            timeLeftMS,
            unit,
          });

          Alert.alert(
            'Still blocked',
            `You still need to wait ~ ${timeAmount} ${unit} before trying again`
          );
          params.onCancel();
          finished.current = true;
          goBack();
        } else {
          await saveAuthTimelock(null);
        }
      }
    };

    checkTimelock();
  }, [goBack, params]);

  useEffect(() => {
    if (attemptsLeft === 0) {
      Alert.alert(
        'Too many tries!',
        `You need to wait ${TIMELOCK_INTERVAL_MINUTES} minutes before trying again`
      );
      // Set global
      saveAuthTimelock(Date.now() + TIMELOCK_INTERVAL_MINUTES * 60 * 1000);
      params.onCancel();
      finished.current = true;
      goBack();
    }
  }, [attemptsLeft, goBack, params]);

  const handleNumpadPress = useCallback(
    newValue => {
      setValue(prevValue => {
        let nextValue = prevValue;
        if (nextValue === null) {
          nextValue = newValue;
        } else if (newValue === 'back') {
          nextValue = prevValue.slice(0, -1);
        } else {
          if (nextValue.length <= 3) {
            nextValue += newValue;
          }
        }

        if (nextValue.length === 4) {
          if (actionType === 'authentication') {
            const valid = params.validPin === nextValue;
            if (!valid) {
              onShake();
              setAttemptsLeft(attemptsLeft - 1);
              setTimeout(() => {
                setValue('');
              }, 300);
            } else {
              params.onSuccess(nextValue);
              finished.current = true;
              goBack();
            }
          } else if (actionType === 'creation') {
            // Ask for confirmation
            setActionType('confirmation');
            // Store the pin in state so we can compare with the conf.
            setInitialPin(nextValue);

            // Clear the pin
            setValue('');
          } else {
            // Confirmation
            const valid = initialPin === nextValue;
            if (!valid) {
              onShake();
            } else {
              params.onSuccess(nextValue);
              finished.current = true;
              goBack();
            }
          }
        }

        return nextValue;
      });
    },
    [actionType, attemptsLeft, goBack, initialPin, onShake, params]
  );

  return (
    <Column backgroundColor={colors.white} flex={1}>
      <Centered flex={1}>
        <ColumnWithMargins
          align="center"
          css={padding(0, 24, isNarrowPhone ? 12 : 24)}
          height="25%"
          justify="center"
          margin={isSmallPhone ? 0 : 28}
        >
          <Logo />
          <SheetTitle>
            {actionType === 'authentication'
              ? 'Type your PIN'
              : actionType === 'creation'
              ? 'Choose your PIN'
              : 'Confirm your PIN'}
          </SheetTitle>
          <PinValue translateX={errorAnimation} value={value} />
        </ColumnWithMargins>
      </Centered>
      <ColumnWithMargins align="center" margin={isTallPhone ? 27 : 12}>
        <Centered maxWidth={313}>
          <Numpad
            decimal={false}
            onPress={handleNumpadPress}
            width={isNarrowPhone ? 275 : '100%'}
          />
        </Centered>
      </ColumnWithMargins>
    </Column>
  );
};

export default React.memo(PinAuthenticationScreen);
