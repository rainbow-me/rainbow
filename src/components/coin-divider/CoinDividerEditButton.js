import React, { useCallback } from 'react';
import { LayoutAnimation } from 'react-native';
import styled from 'styled-components/primitives';
import { colors, padding, shadow } from '../../styles';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';

const ButtonContent = styled(Row).attrs({
  justify: 'center',
})`
  ${padding(5, 10, 6)};
  ${({ isActive }) =>
    isActive ? shadow.build(0, 4, 6, colors.appleBlue, 0.4) : ''};
  background-color: ${({ isActive }) =>
    isActive ? colors.appleBlue : colors.alpha(colors.blueGreyDark, 0.06)};
  border-radius: 15;
  height: 30;
`;

const CoinDividerEditButton = ({
  isActive,
  isVisible,
  onPress,
  shouldReloadList,
  style,
  text,
  textOpacityAlwaysOn,
}) => {
  const handlePress = useCallback(async () => {
    await onPress();
    if (shouldReloadList) {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
      );
    }
  }, [onPress, shouldReloadList]);

  return (
    <OpacityToggler endingOpacity={1} isVisible={isVisible} startingOpacity={0}>
      <ButtonPressAnimation
        onPress={handlePress}
        scaleTo={textOpacityAlwaysOn || isActive ? 0.9 : 1}
      >
        <ButtonContent isActive={isActive} style={style}>
          <Text
            align="center"
            color={isActive ? 'white' : colors.alpha(colors.blueGreyDark, 0.6)}
            letterSpacing="roundedTight"
            opacity={textOpacityAlwaysOn || isActive ? 1 : 0.3333333333}
            size="lmedium"
            weight="semibold"
          >
            {text}
          </Text>
        </ButtonContent>
      </ButtonPressAnimation>
    </OpacityToggler>
  );
};

export default magicMemo(CoinDividerEditButton, [
  'isActive',
  'isVisible',
  'text',
]);
