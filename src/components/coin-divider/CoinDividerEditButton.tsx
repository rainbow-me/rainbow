import React, { useCallback } from 'react';
import { LayoutAnimation } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { magicMemo } from '../../utils';
import { ButtonPressAnimation, OpacityToggler } from '../animations';
import { Row } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, shadow } from '@rainbow-me/styles';

const ButtonContent = styled(Row).attrs({
  justify: 'center',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  ${padding(ios ? 5 : 0, 10, 6)};
  ${({ isActive, theme: { colors, isDarkMode } }) =>
    isActive
      ? shadow.build(
          0,
          4,
          12,
          isDarkMode ? colors.shadow : colors.appleBlue,
          0.4
        )
      : ''};
  background-color: ${({ isActive, theme: { colors } }) =>
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
}: any) => {
  const { colors } = useTheme();

  const handlePress = useCallback(async () => {
    await onPress();
    if (shouldReloadList) {
      LayoutAnimation.configureNext(
        LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
      );
    }
  }, [onPress, shouldReloadList]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <OpacityToggler isVisible={!isVisible}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation
        onPress={handlePress}
        radiusAndroid={15}
        scaleTo={textOpacityAlwaysOn || isActive ? 0.9 : 1}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ButtonContent isActive={isActive} style={style}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
            align={ios ? 'center' : 'left'}
            color={
              isActive
                ? colors.whiteLabel
                : colors.alpha(colors.blueGreyDark, 0.6)
            }
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

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(CoinDividerEditButton, [
  'isActive',
  'isVisible',
  'text',
]);
