import { useRoute } from '@react-navigation/core';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import RainbowLogo from '../assets/rainbows/light.png';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
import { Numpad, PinValue } from '../components/numpad';
import { SheetTitle } from '../components/sheet';
import { useDimensions, useShakeAnimation } from '../hooks';
import { useNavigation } from '../navigation/Navigation';
import { colors, padding } from '@rainbow-me/styles';
const Logo = styled(FastImage).attrs({
  source: RainbowLogo,
})`
  width: 80;
  height: 80;
`;

const PinAuthenticationScreen = () => {
  const { params } = useRoute();
  const { goBack, setParams } = useNavigation();
  const [errorAnimation, onShake] = useShakeAnimation();

  const { isNarrowPhone, isSmallPhone, isTallPhone } = useDimensions();
  const [scaleAnim] = useState(1);

  const [value, setValue] = useState('');
  const [initialPin, setInitialPin] = useState('');
  const [actionType, setActionType] = useState(
    params.validPin ? 'authentication' : 'creation'
  );

  const finished = useRef(false);

  useEffect(() => {
    // setParams({ gesturesEnabled: false });
    return () => {
      if (!finished.current) {
        params.onCancel();
        //setParams({ gesturesEnabled: true });
      }
    };
  }, [params, setParams]);

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

        console.log('next value', nextValue);

        if (nextValue.length === 4) {
          if (actionType === 'authentication') {
            const valid = params.validPin === nextValue;
            if (!valid) {
              onShake();
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
            console.log('set initial pin as', nextValue);

            // Clear the pin
            setValue('');
          } else {
            const valid = initialPin === nextValue;
            if (!valid) {
              onShake();
              console.log('shake it up baby');
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
    [actionType, goBack, initialPin, onShake, params]
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
          <PinValue
            scale={scaleAnim}
            translateX={errorAnimation}
            value={value}
          />
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
