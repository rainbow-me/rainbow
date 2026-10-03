import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

import { useRoute } from '@react-navigation/native';
import { triggerHaptics } from 'react-native-turbo-haptics';

import RainbowLogo from '@/assets/rainbows/light.png';
import { ImgixImage } from '@/components/images';
import { Centered, Column, ColumnWithMargins } from '@/components/layout';
import { Numpad, PinValue } from '@/components/numpad';
import { SheetTitle } from '@/components/sheet';
import { PIN_LOCKOUT_MINUTES, recordFailedPinAttempt, restorePinAttempts } from '@/features/local-auth/pinAttempts';
import styled from '@/framework/ui/styled-thing';
import { getAuthTimelock, getPinAuthAttemptsLeft, saveAuthTimelock, savePinAuthAttemptsLeft } from '@/handlers/localstorage/globalSettings';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { useBlockBackButton } from '@/hooks/useBlockBackButton';
import useDimensions from '@/hooks/useDimensions';
import { useShakeAnimation } from '@/hooks/useShakeAnimation';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { useNavigation } from '@/navigation/Navigation';
import { padding } from '@/styles';

const Logo = styled(ImgixImage).attrs({
  source: RainbowLogo,
  size: 80,
})({
  height: 80,
  width: 80,
});

/** @param {import('@/features/local-auth/pinAttempts').PinAttemptState} state */
function persistPinAttempts(state) {
  if (state.lockedUntil !== null) {
    // Persist the deadline first so interruption cannot leave an exhausted budget without its lockout.
    saveAuthTimelock(state.lockedUntil);
    savePinAuthAttemptsLeft(state.attemptsLeft);
  } else {
    // Reset an expired budget before clearing the deadline.
    savePinAuthAttemptsLeft(state.attemptsLeft);
    saveAuthTimelock(null);
  }
}

const PinAuthenticationScreen = () => {
  const { params } = useRoute();
  useBlockBackButton(!params.validPin);
  const { goBack } = useNavigation();
  const [errorAnimation, onShake] = useShakeAnimation();
  const { isNarrowPhone, isSmallPhone, isTallPhone } = useDimensions();

  const [value, setValue] = useState('');
  const [actionType, setActionType] = useState(params.validPin ? 'authentication' : 'creation');
  const actionTypeRef = useRef(actionType);
  const initialPin = useRef('');
  const valueRef = useRef('');
  const attemptState = useRef(/** @type {import('@/features/local-auth/pinAttempts').PinAttemptState | null} */ (null));
  const inputBlocked = useRef(true);
  const finished = useRef(false);
  const mounted = useRef(false);
  const timeout = useRef(/** @type {ReturnType<typeof setTimeout> | null} */ (null));
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const cancel = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    inputBlocked.current = true;
    paramsRef.current.onCancel();
    goBack();
  }, [goBack]);

  const handleStorageError = useCallback(() => {
    logger.error(new RainbowError('[PinAuthenticationScreen]: Unable to restore or persist PIN attempts'));
    Alert.alert(i18n.t(i18n.l.error_boundary.something_went_wrong));
    cancel();
  }, [cancel]);

  const showLockout = useCallback(
    (lockedUntil, exhausted = false) => {
      if (exhausted) {
        Alert.alert(
          i18n.t(i18n.l.wallet.pin_authentication.too_many_tries),
          i18n.t(i18n.l.wallet.pin_authentication.you_need_to_wait_minutes_plural, { minutesCount: PIN_LOCKOUT_MINUTES })
        );
      } else {
        const secondsLeft = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000));
        const useMinutes = secondsLeft > 60;
        Alert.alert(
          i18n.t(i18n.l.wallet.pin_authentication.still_blocked),
          i18n.t(i18n.l.wallet.pin_authentication.you_still_need_to_wait, {
            timeAmount: useMinutes ? Math.ceil(secondsLeft / 60) : secondsLeft,
            unitName: useMinutes ? i18n.t(i18n.l.time.minutes.long.plural) : i18n.t(i18n.l.time.seconds.long.plural),
          })
        );
      }
      cancel();
    },
    [cancel]
  );

  useEffect(() => {
    let active = true;
    mounted.current = true;
    inputBlocked.current = true;
    Keyboard.dismiss();

    const init = async () => {
      try {
        const [storedAttempts, storedTimelock] = await Promise.all([getPinAuthAttemptsLeft(), getAuthTimelock()]);
        if (!active || finished.current) return;
        const restored = restorePinAttempts(storedAttempts, storedTimelock, Date.now());
        persistPinAttempts(restored);
        attemptState.current = restored;
        if (restored.lockedUntil !== null) {
          showLockout(restored.lockedUntil);
          return;
        }
        inputBlocked.current = false;
      } catch {
        if (active && !finished.current) handleStorageError();
      }
    };

    init();

    return () => {
      active = false;
      mounted.current = false;
      inputBlocked.current = true;
      if (timeout.current !== null) clearTimeout(timeout.current);
      if (!finished.current) {
        finished.current = true;
        paramsRef.current.onCancel();
      }
    };
  }, [handleStorageError, showLockout]);

  const clearEntryAfterDelay = useCallback(() => {
    timeout.current = setTimeout(() => {
      if (!mounted.current || finished.current) return;
      valueRef.current = '';
      setValue('');
      inputBlocked.current = false;
    }, 300);
  }, []);

  const acceptPin = useCallback(
    pin => {
      finished.current = true;
      paramsRef.current.onSuccess(pin);
      timeout.current = setTimeout(() => {
        if (mounted.current) goBack();
      }, 300);
    },
    [goBack]
  );

  const handleNumpadPress = useCallback(
    newValue => {
      if (!mounted.current || inputBlocked.current || finished.current || attemptState.current === null) return;
      Platform.OS === 'android' && triggerHaptics('selection');

      const previousValue = valueRef.current;
      if (newValue === 'back' && previousValue === '' && actionTypeRef.current === 'confirmation') {
        actionTypeRef.current = 'creation';
        setActionType('creation');
        initialPin.current = '';
        return;
      }

      const nextValue = newValue === 'back' ? previousValue.slice(0, -1) : (previousValue + newValue).slice(0, 4);
      valueRef.current = nextValue;
      setValue(nextValue);
      if (nextValue.length !== 4) return;

      // Block synchronously: another tap must not submit this completed entry again.
      inputBlocked.current = true;
      if (actionTypeRef.current === 'authentication') {
        if (paramsRef.current.validPin === nextValue) {
          acceptPin(nextValue);
          return;
        }

        try {
          const nextState = recordFailedPinAttempt(attemptState.current, Date.now());
          persistPinAttempts(nextState);
          attemptState.current = nextState;
          if (nextState.lockedUntil !== null) {
            showLockout(nextState.lockedUntil, true);
            return;
          }
        } catch {
          handleStorageError();
          return;
        }
        onShake();
        clearEntryAfterDelay();
      } else if (actionTypeRef.current === 'creation') {
        actionTypeRef.current = 'confirmation';
        setActionType('confirmation');
        initialPin.current = nextValue;
        clearEntryAfterDelay();
      } else if (initialPin.current === nextValue) {
        acceptPin(nextValue);
      } else {
        onShake();
        clearEntryAfterDelay();
      }
    },
    [acceptPin, clearEntryAfterDelay, handleStorageError, onShake, showLockout]
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
              ? i18n.t(i18n.l.wallet.pin_authentication.type_your_pin)
              : actionType === 'creation'
                ? i18n.t(i18n.l.wallet.pin_authentication.choose_your_pin)
                : i18n.t(i18n.l.wallet.pin_authentication.confirm_your_pin)}
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

const MemoizedPinAuthenticationScreen = React.memo(PinAuthenticationScreen);
export { MemoizedPinAuthenticationScreen as PinAuthenticationScreen };
