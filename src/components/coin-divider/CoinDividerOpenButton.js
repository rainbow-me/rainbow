import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';
import Animated, { useAnimatedStyle, useDerivedValue, withSpring } from 'react-native-reanimated';
import styled from '@/styled-thing';
import { padding } from '@/styles';
import i18n from '@/languages';
import Caret from '../../assets/family-dropdown-arrow.png';
import { ImgixImage } from '@/components/images';

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  source: Caret,
  tintColor: colors.blueGreyDark,
  size: 30,
}))({
  height: 18,
  width: 8,
});

const AnimatedRow = Animated.createAnimatedComponent(Row);

const ButtonContent = styled(AnimatedRow).attrs({
  justify: 'center',
})(({ isActive, theme: { colors, isDarkMode } }) => ({
  ...padding.object(5, 10, 6),
  backgroundColor: colors.alpha(colors.blueGreyDark, 0.06),
  borderRadius: 15,
  height: 30,
}));

const CoinDividerEditButton = ({ isSmallBalancesOpen, onPress }) => {
  const { colors } = useTheme();

  const animation = useDerivedValue(
    () =>
      withSpring(isSmallBalancesOpen ? 1 : 0, {
        damping: 24,
        stiffness: 320,
      }),
    [isSmallBalancesOpen]
  );

  const style = useAnimatedStyle(() => {
    return {
      paddingLeft: 6,
      opacity: 0.6,
      transform: [
        { translateX: 0 + animation.value * 5 },
        { translateY: animation.value * 1.25 },
        { rotate: animation.value * -90 + 'deg' },
      ],
    };
  });

  const containerStyle = useAnimatedStyle(() => ({
    paddingRight: 10 + animation.value * 5,
  }));

  return (
    <Row paddingHorizontal={17}>
      <ButtonPressAnimation onPress={onPress} radiusAndroid={15} scaleTo={0.9}>
        <ButtonContent style={containerStyle} align="center">
          <Text
            align={'left'}
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            letterSpacing="roundedTight"
            opacity={1}
            size="lmedium"
            weight="bold"
          >
            {isSmallBalancesOpen ? i18n.button.less() : i18n.button.all()}
          </Text>
          <Animated.View style={style}>
            <CaretIcon />
          </Animated.View>
        </ButtonContent>
      </ButtonPressAnimation>
    </Row>
  );
};

export default magicMemo(CoinDividerEditButton, ['isSmallBalancesOpen', 'isVisible']);
