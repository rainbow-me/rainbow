import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Column, Row } from '../../layout';
import { AnimatedNumber, Text } from '../../text';
import { margin, padding } from '@rainbow-me/styles';

const GweiPill = styled(LinearGradient).attrs(({ theme: { colors } }) => ({
  colors: colors.gradients.lighterGrey,
  end: { x: 0.5, y: 1 },
  start: { x: 0, y: 0 },
}))`
  border-radius: 15;
  ${padding(10, 12)}
  ${margin(0, 6)}
`;

const StepButton = styled(Text).attrs(({ theme: { colors }, color }) => ({
  color: color || colors.appleBlue,
  size: 'lmedium',
  weight: 'heavy',
}))``;

const InputColumn = styled(Column).attrs({
  justify: 'center',
})``;

const GweiNumber = styled(AnimatedNumber).attrs(
  ({ theme: { colors }, value }) => ({
    color: !value && colors.grey,
    interval: 1,
    letterSpacing: 'roundedTight',
    size: 'lmedium',
    steps: 1,
    textAlign: 'left',
    timing: 'linear',
    weight: 'heavy',
  })
)`
  flex-grow: 1;
`;

const GweiStepButton = ({ type, changeValue, buttonColor }) => {
  return (
    <ButtonPressAnimation onLongPress={changeValue} onPress={changeValue}>
      <StepButton color={buttonColor}>{type === 'plus' ? '􀁍' : '􀁏'}</StepButton>
    </ButtonPressAnimation>
  );
};

const GweiInputPill = ({ value, onPress }) => {
  return (
    <ButtonPressAnimation onPress={onPress}>
      <GweiPill>
        <Row>
          <Column>
            <GweiNumber value={value} />
          </Column>
          <Column>
            <Text size="lmedium" weight="heavy">
              {' '}
              Gwei
            </Text>
          </Column>
        </Row>
      </GweiPill>
    </ButtonPressAnimation>
  );
};

export default function GweiInput({
  value,
  plusAction,
  minusAction,
  onPressValue,
  buttonColor,
}) {
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
        <GweiInputPill onPress={onPressValue} value={value} />
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
