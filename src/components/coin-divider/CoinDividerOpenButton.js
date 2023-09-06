import React from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Caret from '../../assets/family-dropdown-arrow.png';
import { ButtonPressAnimation, RoundButtonCapSize } from '../animations';
import { Text } from '../text';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { magicMemo } from '@/utils';
import * as i18n from '@/languages';

const AnimatedText = Animated.createAnimatedComponent(Text);

const closedWidth = 52.5;
const openWidth = 78;

const CaretIcon = styled(ImgixImage).attrs(({ theme: { colors } }) => ({
  source: Caret,
  tintColor: colors.blueGreyDark,
  size: 30,
}))({
  height: 18,
  width: 8,
});

const Content = styled(Animated.View)({
  backgroundColor: ({ theme: { colors } }) => colors.blueGreyDarkLight,
  borderRadius: RoundButtonCapSize / 2,
  height: 30,
  width: 78,
});

const LabelText = styled(AnimatedText).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.6),
  letterSpacing: 'roundedTight',
  lineHeight: 30,
  size: 'lmedium',
  weight: 'bold',
}))({
  bottom: android ? 0 : 0.5,
  left: 10,
  position: 'absolute',
});

const CoinDividerOpenButton = ({ isSmallBalancesOpen, onPress }) => {
  const isSmallBalancesOpenValue = useSharedValue(0);

  isSmallBalancesOpenValue.value = isSmallBalancesOpen;
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
      height: 20,
      marginTop: 6,
      opacity: 0.6,
      position: 'absolute',
      transform: [
        { translateX: 35 + animation.value * 22 },
        { translateY: animation.value * -1.25 },
        { rotate: animation.value * -90 + 'deg' },
      ],
    };
  });

  const allLabelStyle = useAnimatedStyle(() => ({
    opacity: 1 - animation.value * 1,
  }));

  const lessLabelStyle = useAnimatedStyle(() => ({
    opacity: animation.value * 1,
  }));

  const wrapperStyle = useAnimatedStyle(() => ({
    width: closedWidth + animation.value * (openWidth - closedWidth),
  }));

  return (
    <View width={isSmallBalancesOpen ? 116 : 90.5}>
      <ButtonPressAnimation onPress={onPress} scaleTo={0.8}>
        <View paddingHorizontal={19} paddingVertical={5}>
          <Content style={wrapperStyle}>
            <LabelText style={allLabelStyle}>
              {i18n.t(i18n.l.button.all)}
            </LabelText>
            <LabelText style={lessLabelStyle}>
              {i18n.t(i18n.l.button.less)}
            </LabelText>
            <Animated.View style={style}>
              <CaretIcon />
            </Animated.View>
          </Content>
        </View>
      </ButtonPressAnimation>
    </View>
  );
};

export default magicMemo(CoinDividerOpenButton, [
  'isSmallBalancesOpen',
  'isVisible',
]);
