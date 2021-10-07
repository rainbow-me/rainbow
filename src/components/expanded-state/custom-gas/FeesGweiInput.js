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

const StepButton = styled(Text).attrs(({ theme: { colors } }) => ({
  color: colors.purple,
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

const GweiStepButton = ({ type, setValue }) => {
  const changeValue = () => {
    if (type === 'plus') {
      setValue(value => value + 1);
    } else {
      setValue(value => value - 1);
    }
  };
  return (
    <ButtonPressAnimation onPress={changeValue}>
      <StepButton>{type === 'plus' ? '􀁍' : '􀁏'}</StepButton>
    </ButtonPressAnimation>
  );
};

const GweiInputPill = ({ value }) => {
  return (
    <ButtonPressAnimation>
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

export default function GweiInput({ value, plusAction, minusAction }) {
  return (
    <Row>
      <InputColumn justify="center">
        <GweiStepButton setValue={minusAction} type="minus" />
      </InputColumn>
      <InputColumn>
        <GweiInputPill value={value} />
      </InputColumn>
      <InputColumn justify="center">
        <GweiStepButton setValue={plusAction} type="plus" />
      </InputColumn>
    </Row>
  );
}
