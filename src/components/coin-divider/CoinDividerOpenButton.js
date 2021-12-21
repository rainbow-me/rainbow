import React from 'react';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import styled from 'styled-components';
import Caret from '../../assets/family-dropdown-arrow.png';
import { ButtonPressAnimation, RoundButtonCapSize } from '../animations';
import { Text } from '../text';
import { ImgixImage } from '@rainbow-me/images';
import { padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';

const closedWidth = 52.5;
const openWidth = 80;

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  source: Caret,
  tintColor: colors.blueGreyDark,
}))`
  height: 18;
  width: 8;
`;

const Content = styled(Animated.View).attrs({
  align: 'center',
  flexDirection: 'row',
  justify: 'space-between',
})`
  background-color: ${({ theme: { colors } }) => colors.blueGreyDarkLight};
  ${padding(0, 10)};
  border-radius: ${RoundButtonCapSize / 2};
  height: ${({ height }) => height};
`;

const LabelText = styled(Text).attrs(({ shareButton, theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedTight',
  lineHeight: 30,
  size: 'lmedium',
  weight: shareButton ? 'heavy' : 'bold',
}))``;

const buttonPressAnimationStyle = {
  flexDirection: 'row',
};

const CoinDividerOpenButton = ({
  coinDividerHeight,
  isSmallBalancesOpen,
  onPress,
}) => {
  const isSmallBalancesOpenValue = useSharedValue(0);

  isSmallBalancesOpenValue.value = isSmallBalancesOpen;
  const animation = useDerivedValue(
    () =>
      withTiming(isSmallBalancesOpen ? 1 : 0, {
        friction: 20,
        tension: 200,
      }),
    [isSmallBalancesOpen]
  );

  const style = useAnimatedStyle(() => {
    return {
      height: 20,
      marginLeft: 4,
      marginTop: 7,
      opacity: 0.6,
      transform: [
        { translateX: animation.value * 7 },
        { translateY: animation.value * -2 },
        { rotate: animation.value * -90 + 'deg' },
      ],
    };
  });

  const wrapperStyle = useAnimatedStyle(() => ({
    width: closedWidth + animation.value * (openWidth - closedWidth),
  }));

  return (
    <ButtonPressAnimation onPress={onPress} style={buttonPressAnimationStyle}>
      <Content height={coinDividerHeight} style={wrapperStyle}>
        <LabelText color="secondary30" weight="bold">
          {isSmallBalancesOpen ? 'Less' : 'All'}
        </LabelText>
        <Animated.View style={style}>
          <CaretIcon />
        </Animated.View>
      </Content>
    </ButtonPressAnimation>
  );
};

export default magicMemo(CoinDividerOpenButton, [
  'isSmallBalancesOpen',
  'isVisible',
]);
