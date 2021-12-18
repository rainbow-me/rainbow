import React from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { useIsCoinListEditedSharedValue } from '@rainbow-me/helpers/SharedValuesContext';
import styled from 'styled-components';
import { borders, shadow } from '@rainbow-me/styles';

const IndicatorIcon = styled(Icon).attrs(({ isPinned, theme: { colors } }) => ({
  color: colors.whiteLabel,
  name: isPinned ? 'pin' : 'hidden',
}))(({ isPinned }) => ({
  height: isPinned ? 13 : 10,
  marginTop: isPinned ? 1 : 0,
  width: isPinned ? 8 : 14,
}));

const IndicatorIconContainer = styled(Centered)(
  ({ theme: { isDarkMode, colors } }) => ({
    ...borders.buildCircleAsObject(22),
    ...shadow.buildAsObject(
      0,
      4,
      12,
      isDarkMode ? colors.shadow : colors.blueGreyDark,
      0.4
    ),
    alignSelf: 'center',
    backgroundColor: colors.blueGreyDark50,
    bottom: 9,
    left: 19,
    position: 'absolute',
  })
);

export default function CoinIconIndicator({ isFirstCoinRow, isPinned }) {
  const isCoinListEditedSharedValue = useIsCoinListEditedSharedValue();
  const style = useAnimatedStyle(
    () => ({
      opacity: isCoinListEditedSharedValue.value ? 1 : 0,
    }),
    []
  );

  return (
    <IndicatorIconContainer
      as={Animated.View}
      isFirstCoinRow={isFirstCoinRow}
      style={style}
    >
      <IndicatorIcon isPinned={isPinned} />
    </IndicatorIconContainer>
  );
}
