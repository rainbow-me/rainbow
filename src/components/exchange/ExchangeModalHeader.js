import React, { useEffect, useRef } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { usePrevious } from '../../hooks';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Column } from '../layout';
import { SheetHandle } from '../sheet';
import { Text } from '../text';
import { colors, padding, position } from '@rainbow-me/styles';

const SheetHandleMargin = 6;

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

const InfoButton = styled(ButtonPressAnimation).attrs({
  opacityTouchable: true,
  scaleTo: 1.3,
})`
  ${padding(0, 19)};
  ${position.centered};
  margin-top: ${SheetHandleMargin + 4};
`;

const InfoButtonIcon = styled(Icon).attrs({
  color: colors.alpha(colors.blueGreyDark, 0.3),
  name: 'info',
})`
  ${position.size(18)};
`;

const InfoButtonTransition = styled(Transitioning.View)`
  ${position.centered};
  bottom: 0;
  position: absolute;
  right: 0;
  top: 0;
`;

const ExchangeModalHeader = ({
  onPressDetails,
  showDetailsButton,
  testID,
  title = 'Swap',
}) => {
  const transitionRef = useRef();
  const prevShowDetailsButton = usePrevious(showDetailsButton);

  useEffect(() => {
    if (showDetailsButton !== prevShowDetailsButton) {
      transitionRef.current?.animateNextTransition();
    }
  }, [prevShowDetailsButton, showDetailsButton]);

  return (
    <Column align="center" css={padding(6, 0)} testID={testID}>
      <SheetHandle marginBottom={SheetHandleMargin} />
      <Text align="center" lineHeight="loose" size="large" weight="heavy">
        {title}
      </Text>
      <InfoButtonTransition ref={transitionRef} transition={transition}>
        {showDetailsButton && (
          <InfoButton onPress={onPressDetails} testID="swap-info-button">
            <InfoButtonIcon />
          </InfoButton>
        )}
      </InfoButtonTransition>
    </Column>
  );
};

export default React.memo(ExchangeModalHeader);
