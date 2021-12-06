import React, { useCallback, useMemo } from 'react';
import { Share } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Centered, InnerBorder } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const Label = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  lineHeight: 'looser',
  size: 'larger',
  weight: 'heavy',
}))`
  bottom: 2;
`;

export default function ShareButton({ accountAddress, ...props }: any) {
  const handlePress = useCallback(() => {
    Share.share({
      message: accountAddress,
      title: 'My account address:',
    });
  }, [accountAddress]);

  const { isDarkMode, colors } = useTheme();

  const shadows = useMemo(
    () => [
      [0, 10, 30, colors.shadow, 0.2],
      [0, 5, 15, colors.shadow, isDarkMode ? 0 : 0.4],
    ],
    [isDarkMode, colors]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      onPress={handlePress}
      overflowMargin={20}
      radiusAndroid={28}
      {...props}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ShadowStack
        backgroundColor={isDarkMode ? colors.white : colors.dark}
        borderRadius={28}
        height={56}
        shadows={shadows}
        width={123}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered cover>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Label>􀈂 Share</Label>
        </Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <InnerBorder />
      </ShadowStack>
    </ButtonPressAnimation>
  );
}
