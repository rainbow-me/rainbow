import React from 'react';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { CoinIconIndicator, CoinIconSize } from '../coin-icon';
import { Icon } from '../icons';
import { Row } from '../layout';
import { useCoinListFinishEditingOptions } from '@/hooks';
import styled from '@/styled-thing';
import { borders, padding, position, shadow } from '@/styles';

const Container = styled.View({
  ...position.sizeAsObject(CoinIconSize),
  position: 'relative',
  top: 0,
});

const Content = styled(Row).attrs({
  align: 'center',
  justify: 'center',
})({
  ...position.sizeAsObject('100%'),
});

const CircleOutline = styled.View({
  ...borders.buildCircleAsObject(22),
  borderColor: ({ theme: { colors } }) => colors.alpha(colors.blueGreyDark, 0.12),
  borderWidth: 1.5,
  left: 19,
  position: 'absolute',
});

const CheckmarkBackground = styled.View(({ theme: { colors, isDarkMode }, left }) => ({
  ...borders.buildCircleAsObject(22),
  ...padding.object(4.5),
  backgroundColor: colors.appleBlue,
  left: left || 0,

  ...shadow.buildAsObject(0, 4, 12, isDarkMode ? colors.shadow : colors.appleBlue, 0.4),
}));

const CoinCheckButton = ({ isHidden, isPinned, onPress, toggle: givenToggle, uniqueId, left, ...props }) => {
  const { selectedItems } = useCoinListFinishEditingOptions();
  const toggle = givenToggle || selectedItems.includes(uniqueId);

  return (
    <Container {...props}>
      <Content as={ButtonPressAnimation} onPress={onPress} opacityTouchable>
        {isHidden || isPinned ? null : <CircleOutline />}
        {!toggle && (isHidden || isPinned) ? <CoinIconIndicator isPinned={isPinned} /> : null}
        <OpacityToggler friction={20} isVisible={!toggle} tension={1000}>
          <CheckmarkBackground left={left}>
            <Icon color="white" name="checkmark" />
          </CheckmarkBackground>
        </OpacityToggler>
      </Content>
    </Container>
  );
};

export default magicMemo(CoinCheckButton, ['toggle', 'uniqueId', 'isHidden', 'isPinned']);
