import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../../animations';
import { Input } from '../../inputs';
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
    value: value,
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
    <ButtonPressAnimation onPress={changeValue} scaleTo={1.2}>
      <StepButton>{type === 'plus' ? '􀁍' : '􀁏'}</StepButton>
    </ButtonPressAnimation>
  );
};

const GweiInputPill = ({ value, setValue }) => {
  const { theme, colors } = useTheme();
  const [isActive, setIsActive] = useState(false);
  const inputRef = useRef(null);
  const handlePress = () => {
    setIsActive(true);
    inputRef.current?.focus();
  };
  const handleBlur = () => {
    setIsActive(false);
  };
  return (
    <ButtonPressAnimation onPress={handlePress} scaleTo={1.05}>
      <GweiPill isActive={isActive}>
        <Row>
          <Column>
            {/* <GweiNumber value={value} /> */}
            <Input
              fontVariant={['tabular-nums']}
              color={
                theme === 'dark'
                  ? colors.whiteLabel
                  : colors.alpha(colors.black, 1)
              }
              height={19}
              keyboardAppearance="dark"
              keyboardType="numeric"
              letterSpacing="roundedMedium"
              maxLength={5}
              onBlur={handleBlur}
              onChangeText={setValue}
              //   onSubmitEditing={handleInputButtonManager}
              placeholder={0}
              placeholderTextColor={
                theme === 'dark'
                  ? colors.alpha(darkModeThemeColors.blueGreyDark, 0.3)
                  : colors.alpha(colors.blueGreyDark, 0.3)
              }
              ref={inputRef}
              size="lmedium"
              testID="custom-gas-input"
              value={`${value}`}
              weight="bold"
            />
          </Column>
          <Column>
            <Text size="lmedium" weight="bold">
              {' '}
              Gwei
            </Text>
          </Column>
        </Row>
      </GweiPill>
    </ButtonPressAnimation>
  );
};

export default function GweiInput({ value, setValue }) {
  return (
    <Row>
      <InputColumn>
        <GweiStepButton setValue={setValue} type="minus" />
      </InputColumn>
      <InputColumn>
        <GweiInputPill value={value} setValue={setValue} />
      </InputColumn>
      <InputColumn>
        <GweiStepButton setValue={setValue} type="plus" />
      </InputColumn>
    </Row>
  );
}
