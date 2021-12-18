import React from 'react';
import styled from '@rainbow-me/styled';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { CoinIconIndicator, CoinIconSize } from '../coin-icon';
import { Icon } from '../icons';
import { Row } from '../layout';
import { useCoinListFinishEditingOptions } from '@rainbow-me/hooks';
import { borders, padding, position, shadow } from '@rainbow-me/styles';

const Container = styled.View({
  ...position.sizeAsObject(CoinIconSize),
  position: ({ isAbsolute }) => (isAbsolute ? 'absolute' : 'relative'),
  top: 0,
});

const Content = styled(Row).attrs(({ isAbsolute }) => ({
  align: 'center',
  justify: isAbsolute ? 'start' : 'center',
}))({
  ...position.sizeAsObject('100%'),
});

const CircleOutline = styled.View({
  ...borders.buildCircleAsObject(22),
  borderColor: ({ theme: { colors } }) =>
    colors.alpha(colors.blueGreyDark, 0.12),
  borderWidth: 1.5,
  left: 19,
  position: 'absolute',
});

const CheckmarkBackground = styled.View(
  ({ theme: { colors, isDarkMode }, isAbsolute }) => ({
    ...borders.buildCircleAsObject(22),
    ...padding.object(4.5),
    backgroundColor: colors.appleBlue,
    left: isAbsolute ? 19 : 0,

    ...shadow.buildAsObject(
      0,
      4,
      12,
      isDarkMode ? colors.shadow : colors.appleBlue,
      0.4
    ),
  })
);

const CoinCheckButton = ({
  isAbsolute,
  isHidden,
  isPinned,
  onPress,
  toggle: givenToggle,
  uniqueId,
  ...props
}) => {
  const { selectedItems } = useCoinListFinishEditingOptions();
  const toggle = givenToggle || selectedItems.includes(uniqueId);

  return (
    <Container {...props} isAbsolute={isAbsolute}>
      <Content
        as={ButtonPressAnimation}
        isAbsolute={isAbsolute}
        onPress={onPress}
        opacityTouchable
        reanimatedButton
      >
        {isHidden || isPinned ? null : <CircleOutline />}
        {!toggle && (isHidden || isPinned) ? (
          <CoinIconIndicator isPinned={isPinned} />
        ) : null}
        <OpacityToggler friction={20} isVisible={!toggle} tension={1000}>
          <CheckmarkBackground isAbsolute={isAbsolute}>
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
