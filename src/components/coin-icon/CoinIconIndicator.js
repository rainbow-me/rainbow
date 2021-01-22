import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { useTheme } from '../../context/ThemeContext';
import { useCoinListEditedValue } from '../../hooks/useCoinListEdited';
import { Icon } from '../icons';
import { Centered } from '../layout';
import { borders, colors_NOT_REACTIVE, shadow } from '@rainbow-me/styles';

const IndicatorIcon = styled(Icon).attrs(({ isPinned }) => ({
  color: colors_NOT_REACTIVE.whiteLabel,
  name: isPinned ? 'pin' : 'hidden',
}))`
  height: ${({ isPinned }) => (isPinned ? 13 : 10)};
  margin-top: ${({ isPinned }) => (isPinned ? 1 : 0)};
  width: ${({ isPinned }) => (isPinned ? 8 : 14)};
`;

const IndicatorIconContainer = styled(Centered)`
  ${borders.buildCircle(20)};
  ${({ isDarkMode }) =>
    shadow.build(
      0,
      4,
      12,
      isDarkMode
        ? colors_NOT_REACTIVE.shadow
        : colors_NOT_REACTIVE.blueGreyDark,
      0.4
    )}
  background-color: ${colors_NOT_REACTIVE.blueGreyDark50};
  bottom: 3;
  left: 10;
  position: absolute;
  z-index: 10;
`;

export default function CoinIconIndicator({ isPinned }) {
  const isCoinListEditedValue = useCoinListEditedValue();
  const { isDarkMode } = useTheme();

  return (
    <IndicatorIconContainer
      as={Animated.View}
      isDarkMode={isDarkMode}
      style={{ opacity: isCoinListEditedValue }}
    >
      <IndicatorIcon isPinned={isPinned} />
    </IndicatorIconContainer>
  );
}
