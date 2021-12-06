import React from 'react';
import Animated from 'react-native-reanimated';
import styled from 'styled-components';
import { Icon } from '../icons';
import { Centered } from '../layout';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks/useCoinListE... Remove this comment to see the full error message
import { useCoinListEditedValue } from '@rainbow-me/hooks/useCoinListEdited';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders, shadow } from '@rainbow-me/styles';

const IndicatorIcon = styled(Icon).attrs(({ isPinned, theme: { colors } }) => ({
  color: colors.whiteLabel,
  name: isPinned ? 'pin' : 'hidden',
}))`
  height: ${({ isPinned }) => (isPinned ? 13 : 10)};
  margin-top: ${({ isPinned }) => (isPinned ? 1 : 0)};
  width: ${({ isPinned }) => (isPinned ? 8 : 14)};
`;

const IndicatorIconContainer = styled(Centered)`
  ${borders.buildCircle(22)};
  ${({ theme: { isDarkMode, colors } }) =>
    shadow.build(
      0,
      4,
      12,
      isDarkMode ? colors.shadow : colors.blueGreyDark,
      0.4
    )}
  align-self: center;
  background-color: ${({ theme: { colors } }) => colors.blueGreyDark50};
  bottom: 9;
  left: 19;
  position: absolute;
`;

export default function CoinIconIndicator({ isFirstCoinRow, isPinned }: any) {
  const isCoinListEditedValue = useCoinListEditedValue();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <IndicatorIconContainer
      as={Animated.View}
      isFirstCoinRow={isFirstCoinRow}
      style={{ opacity: isCoinListEditedValue }}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <IndicatorIcon isPinned={isPinned} />
    </IndicatorIconContainer>
  );
}
