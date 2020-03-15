import React, { useRef } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { usePrevious } from '../../hooks';
import { colors, padding, position } from '../../styles';
import { TouchableScale } from '../animations';
import { Icon } from '../icons';
import { Centered, Column } from '../layout';
import { SheetHandle } from '../sheet';
import { Text } from '../text';

const InfoButtonPaddingHorizontal = 19;
const InfoIconSize = 18;
const SheetHandleMargin = 6;

const InfoButtonPosition = `
  bottom: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

const InfoButton = styled(Centered).attrs({
  activeScale: 0.8,
  component: TouchableScale,
  hapticType: 'impactLight',
  pressInFriction: 50,
  pressInTension: 400,
  pressOutFriction: 30,
  pressOutTension: 300,
})`
  ${InfoButtonPosition};
  padding-left: ${InfoButtonPaddingHorizontal * 2};
  padding-right: ${InfoButtonPaddingHorizontal};
  padding-top: ${SheetHandleMargin + 4};
`;

const InfoButtonTransition = styled(Transitioning.View)`
  ${position.centered};
  ${InfoButtonPosition};
`;

const transition = (
  <Transition.Sequence>
    <Transition.Out durationMs={200} interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={200} interpolation="easeInOut" />
    <Transition.Together>
      <Transition.In durationMs={75} interpolation="easeOut" type="fade" />
      <Transition.In durationMs={100} interpolation="easeOut" type="scale" />
    </Transition.Together>
  </Transition.Sequence>
);

const ExchangeModalHeader = ({ onPressDetails, showDetailsButton }) => {
  const ref = useRef();
  const prevShowDetailsButton = usePrevious(showDetailsButton);

  if (ref.current && showDetailsButton !== prevShowDetailsButton) {
    ref.current.animateNextTransition();
  }

  return (
    <Column align="center" css={padding(8, 0)}>
      <SheetHandle marginBottom={SheetHandleMargin} />
      <Text align="center" lineHeight="loose" size="large" weight="bold">
        Swap
      </Text>
      <InfoButtonTransition ref={ref} transition={transition}>
        {showDetailsButton && (
          <InfoButton onPress={onPressDetails} useNativeDriver>
            <Icon
              {...position.sizeAsObject(InfoIconSize)}
              color={colors.alpha(colors.blueGreyDark, 0.3)}
              name="info"
            />
          </InfoButton>
        )}
      </InfoButtonTransition>
    </Column>
  );
};

export default React.memo(ExchangeModalHeader);
