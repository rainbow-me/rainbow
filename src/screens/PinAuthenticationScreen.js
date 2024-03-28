import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import RainbowLogo from '../assets/rainbows/light.png';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
import { Numpad, PinValue } from '../components/numpad';
import { SheetTitle } from '../components/sheet';
import {
  getAuthTimelock,
  getPinAuthAttemptsLeft,
  saveAuthTimelock,
  savePinAuthAttemptsLeft,
} from '../handlers/localstorage/globalSettings';
import { useNavigation } from '../navigation/Navigation';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { useDimensions, useShakeAnimation } from '@/hooks';
import { useBlockBackButton } from '@/hooks/useBlockBackButton';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import { haptics } from '@/utils';

const Logo = styled(ImgixImage).attrs({
  source: RainbowLogo,
  size: 80,
})({
  height: 80,
  width: 80,
});

const MAX_ATTEMPTS = 10;
const TIMELOCK_INTERVAL_MINUTES = 5;

const PinAuthenticationScreen = () => {
  const { params } = useRoute();
  useBlockBackButton(!params.validPin);
  const { goBack, setParams } = useNavigation();
  const [errorAnimation, onShake] = useShakeAnimation();

  const { isNarrowPhone, isSmallPhone, isTallPhone } = useDimensions();

  const [attemptsLeft, setAttemptsLeft] = useState(MAX_ATTEMPTS);
  const [value, setValue] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [initialPin, setInitialPin] = useState('');
  const [actionType, setActionType] = useState(params.validPin ? 'authentication' : 'creation');

  const finished = useRef(false);

  useEffect(() => {
    Keyboard.dismiss();
  }, []);

  useEffect(() => {
    // See if the user previously tried and aborted
    // If that's the case, we need to update the default
    // amount of attempts left to prevent abuse
    const init = async () => {
      const attemptsLeft = await getPinAuthAttemptsLeft();
      if (!isNaN(attemptsLeft)) {
        setAttemptsLeft(attemptsLeft);
      }
    };

    init();

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
      if (timelock) {
        const now = Date.now();
        const stillBanned = now < timelock;
        if (stillBanned) {
          const timeLeftMS = timelock - now;
          const timeAmountSeconds = timeLeftMS / 1000;
          const unit = timeAmountSeconds > 60 ? lang.t('time.minutes.long.plural') : lang.t('time.seconds.long.plural');
          const timeAmount = timeAmountSeconds > 60 ? Math.ceil(timeAmountSeconds / 60) : Math.ceil(timeAmountSeconds);

          Alert.alert(
            lang.t('wallet.pin_authentication.still_blocked'),
            lang.t('wallet.pin_authentication.you_still_need_to_wait', {
              timeAmount: timeAmount,
              unitName: unit,
            })
          );
          params.onCancel();
          finished.current = true;
          goBack();
        } else {
          await saveAuthTimelock(null);
          await savePinAuthAttemptsLeft(null);
        }
      }
    };

    checkTimelock();
  }, [goBack, params]);

  useEffect(() => {
    if (attemptsLeft === 0) {
      Alert.alert(
        lang.t('wallet.pin_authentication.too_many_tries'),
        lang.t('wallet.pin_authentication.you_need_to_wait_minutes_plural', {
          minutesCount: TIMELOCK_INTERVAL_MINUTES,
        })
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
      android && haptics.keyboardPress();
      setValue(prevValue => {
        let nextValue = prevValue;
        if (nextValue === null) {
          nextValue = newValue;
        } else if (newValue === 'back') {
          // If pressing back while on confirmation and no value
          // we switch back to "creation" mode so the user can
          // reenter the original pin in case they did a mistake
          if (prevValue === '' && actionType === 'confirmation') {
            setActionType('creation');
            setInitialPin('');
            setValue('');
          } else {
            nextValue = prevValue.slice(0, -1);
          }
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
              savePinAuthAttemptsLeft(attemptsLeft - 1);
              setTimeout(() => {
                setValue('');
              }, 300);
            } else {
              params.onSuccess(nextValue);
              finished.current = true;
              setTimeout(() => {
                goBack();
              }, 300);
            }
          } else if (actionType === 'creation') {
            setLoading(true);
            // Ask for confirmation
            setActionType('confirmation');
            // Store the pin in state so we can compare with the conf.
            setInitialPin(nextValue);

            // Clear the pin
            setTimeout(() => {
              setValue('');
              setLoading(false);
              return;
            }, 300);
          } else {
            if (isLoading) return '';
            // Confirmation
            const valid = initialPin === nextValue;
            if (!valid) {
              onShake();
            } else {
              params.onSuccess(nextValue);
              finished.current = true;
              setTimeout(() => {
                goBack();
              }, 300);
            }
          }
        }

        return nextValue;
      });
    },
    [actionType, attemptsLeft, goBack, initialPin, onShake, params, isLoading]
  );

  const { colors } = useTheme();

  return (
    <Column backgroundColor={colors.white} paddingBottom={48} flex={1} testID="pin-authentication-screen">
      <Centered flex={1}>
        <ColumnWithMargins
          align="center"
          height="25%"
          justify="center"
          margin={isSmallPhone ? 0 : 28}
          style={padding.object(0, 24, isNarrowPhone ? 12 : 24)}
        >
          <Logo />
          <SheetTitle>
            {actionType === 'authentication'
              ? lang.t('wallet.pin_authentication.type_your_pin')
              : actionType === 'creation'
                ? lang.t('wallet.pin_authentication.choose_your_pin')
                : lang.t('wallet.pin_authentication.confirm_your_pin')}
          </SheetTitle>
          <PinValue translateX={errorAnimation} value={value} />
        </ColumnWithMargins>
      </Centered>
      <ColumnWithMargins align="center" margin={isTallPhone ? 27 : 12}>
        <Centered maxWidth={313}>
          <Numpad decimal={false} onPress={handleNumpadPress} width={isNarrowPhone ? 275 : '100%'} />
        </Centered>
      </ColumnWithMargins>
    </Column>
  );
};

export default React.memo(PinAuthenticationScreen);
