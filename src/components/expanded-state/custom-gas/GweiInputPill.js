import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Input } from '../../inputs';
import { Column, Row } from '../../layout';
import { Text } from '../../text';
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

const GweiNumberInput = styled(Input).attrs(({ theme: { colors }, value }) => ({
  color: !value && colors.grey,
  interval: 1,
  letterSpacing: 'roundedTight',
  size: 'lmedium',
  steps: 1,
  textAlign: 'left',
  timing: 'linear',
  weight: 'heavy',
}))``;

const InputColumn = styled(Column).attrs({
  justify: 'center',
})``;

function GweiInputPill({ value, onPress, onChange, onFocus }, ref) {
  return (
    <ButtonPressAnimation onPress={onPress}>
      <GweiPill>
        <Row>
          <InputColumn>
            <GweiNumberInput
              keyboardType="numeric"
              onChange={onChange}
              onFocus={onFocus}
              placeholder="0"
              ref={ref}
              value={!!value && `${value}`}
            />
          </InputColumn>
          <InputColumn>
            <Text size="lmedium" weight="heavy">
              {' '}
              Gwei
            </Text>
          </InputColumn>
        </Row>
      </GweiPill>
    </ButtonPressAnimation>
  );
}

export default React.forwardRef(GweiInputPill);
