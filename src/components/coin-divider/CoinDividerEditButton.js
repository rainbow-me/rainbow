import React, { useCallback } from 'react';
import { LayoutAnimation } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';
import styled from '@/styled-thing';
import { padding, shadow } from '@/styles';

const ButtonContent = styled(Row).attrs({
  justify: 'center',
})(({ isActive, theme: { colors, isDarkMode } }) => ({
  ...padding.object(ios ? 5 : 0, 10, 6),
  ...(isActive ? shadow.buildAsObject(0, 4, 12, isDarkMode ? colors.shadow : colors.appleBlue, 0.4) : {}),
  backgroundColor: isActive ? colors.appleBlue : colors.alpha(colors.blueGreyDark, 0.06),
  borderRadius: 15,
  height: 30,
}));

const CoinDividerEditButton = ({ isActive, isVisible, onPress, shouldReloadList, style, text, textOpacityAlwaysOn }) => {
  const { colors } = useTheme();

  const handlePress = useCallback(async () => {
    await onPress();
    if (shouldReloadList) {
      LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
    }
  }, [onPress, shouldReloadList]);

  return (
    <OpacityToggler isVisible={!isVisible}>
      <ButtonPressAnimation onPress={handlePress} radiusAndroid={15} scaleTo={textOpacityAlwaysOn || isActive ? 0.9 : 1}>
        <ButtonContent isActive={isActive} style={style}>
          <Text
            align={ios ? 'center' : 'left'}
            color={isActive ? colors.whiteLabel : colors.alpha(colors.blueGreyDark, 0.6)}
            letterSpacing="roundedTight"
            opacity={textOpacityAlwaysOn || isActive ? 1 : 0.3333333333}
            size="lmedium"
            weight="bold"
          >
            {text}
          </Text>
        </ButtonContent>
      </ButtonPressAnimation>
    </OpacityToggler>
  );
};

export default magicMemo(CoinDividerEditButton, ['isActive', 'isVisible', 'text']);
