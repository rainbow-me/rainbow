import React, { useRef } from 'react';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
import GweiInputPill from './GweiInputPill';

const StepButton = styled(Text).attrs(({ theme: { colors }, color }) => ({
  color: color || colors.appleBlue,
  size: 'lmedium',
  weight: 'heavy',
}))``;

const InputColumn = styled(Column).attrs({
  justify: 'center',
})``;

const GweiStepButton = ({ type, changeValue, buttonColor }) => {
  return (
    <ButtonPressAnimation
      onLongPress={changeValue}
      onPress={changeValue}
      // onPressEnd={() => console.log('onPressEnd')}
      // onPressStart={() => console.log('onpresstate')}
    >
      <StepButton color={buttonColor}>{type === 'plus' ? '􀁍' : '􀁏'}</StepButton>
    </ButtonPressAnimation>
  );
};

export default function FeesGweiInput({
  value,
  plusAction,
  minusAction,
  onChange,
  onPress,
  buttonColor,
}) {
  const inputRef = useRef(null);

  const onInputPress = useCallback(() => {
    inputRef?.current?.focus();
    onPress?.();
  }, [inputRef, onPress]);

  return (
    <Row>
      <InputColumn justify="center">
        <GweiStepButton
          buttonColor={buttonColor}
          changeValue={minusAction}
          type="minus"
        />
      </InputColumn>
      <InputColumn>
        <GweiInputPill
          onChange={onChange}
          onFocus={onInputPress}
          onPress={onInputPress}
          ref={inputRef}
          value={value}
        />
      </InputColumn>
      <InputColumn justify="center">
        <GweiStepButton
          buttonColor={buttonColor}
          changeValue={plusAction}
          type="plus"
        />
      </InputColumn>
    </Row>
  );
}
