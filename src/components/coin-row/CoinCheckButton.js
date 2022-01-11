import React from 'react';
import styled from 'styled-components';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { CoinIconIndicator, CoinIconSize } from '../coin-icon';
import { Icon } from '../icons';
import { Row } from '../layout';
import { useCoinListFinishEditingOptions } from '@rainbow-me/hooks';
import { borders, padding, position, shadow } from '@rainbow-me/styles';

const Container = styled.View`
  ${position.size(CoinIconSize)};
  position: relative;
  top: 0;
`;

const Content = styled(Row).attrs({
  align: 'center',
  justify: 'center',
})`
  ${position.size('100%')};
`;

const CircleOutline = styled.View`
  ${borders.buildCircle(22)}
  border-color: ${({ theme: { colors } }) =>
    colors.alpha(colors.blueGreyDark, 0.12)};
  border-width: 1.5;
  left: 19;
  position: absolute;
`;

const CheckmarkBackground = styled.View`
  ${borders.buildCircle(22)}
  ${padding(4.5)}
  ${({ theme: { isDarkMode, colors } }) =>
    shadow.build(0, 4, 12, isDarkMode ? colors.shadow : colors.appleBlue, 0.4)}
  background-color: ${({ theme: { colors } }) => colors.appleBlue};
  left: ${({ left }) => left || 0};
`;

const CoinCheckButton = ({
  isHidden,
  isPinned,
  onPress,
  toggle: givenToggle,
  uniqueId,
  left,
  ...props
}) => {
  const { selectedItems } = useCoinListFinishEditingOptions();
  const toggle = givenToggle || selectedItems.includes(uniqueId);

  return (
    <Container {...props}>
      <Content as={ButtonPressAnimation} onPress={onPress} opacityTouchable>
        {isHidden || isPinned ? null : <CircleOutline />}
        {!toggle && (isHidden || isPinned) ? (
          <CoinIconIndicator isPinned={isPinned} />
        ) : null}
        <OpacityToggler friction={20} isVisible={!toggle} tension={1000}>
          <CheckmarkBackground left={left}>
            <Icon color="white" name="checkmark" />
          </CheckmarkBackground>
        </OpacityToggler>
      </Content>
    </Container>
  );
};

export default magicMemo(CoinCheckButton, [
  'toggle',
  'uniqueId',
  'isHidden',
  'isPinned',
]);
