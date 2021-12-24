import React from 'react';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import Caret from '../../assets/family-dropdown-arrow.png';
import { ButtonPressAnimation, RoundButtonCapSize } from '../animations';
import { Flex } from '../layout';
import { Text } from '../text';
import { ImgixImage } from '@rainbow-me/images';
import { padding } from '@rainbow-me/styles';
import { magicMemo } from '@rainbow-me/utils';
import styled from 'rainbowed-components';

const closedWidth = 52.5;
const openWidth = 80;

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  source: Caret,
  tintColor: colors.blueGreyDark,
}))({
  height: 18,
  width: 8,
});

const Content = styled(Flex).attrs({
  align: 'center',
  direction: 'row',
  justify: 'space-between',
})({
  backgroundColor: ({ theme: { colors } }) => colors.blueGreyDarkLight,
  ...padding.object(0, 10),
  borderRadius: RoundButtonCapSize / 2,
  height: ({ height }) => height,
});

const LabelText = styled(Text).attrs(({ shareButton, theme: { colors } }) => ({
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedTight',
  lineHeight: 30,
  size: 'lmedium',
  weight: shareButton ? 'heavy' : 'bold',
}))({});

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
    <Content as={Animated.View} height={coinDividerHeight} style={wrapperStyle}>
      <ButtonPressAnimation onPress={onPress} style={{ flexDirection: 'row' }}>
        <LabelText color="secondary30" weight="bold">
          {isSmallBalancesOpen ? 'Less' : 'All'}
        </LabelText>
        <Animated.View style={style}>
          <CaretIcon />
        </Animated.View>
      </ButtonPressAnimation>
    </Content>
  );
};

export default magicMemo(CoinDividerOpenButton, [
  'isSmallBalancesOpen',
  'isVisible',
]);
