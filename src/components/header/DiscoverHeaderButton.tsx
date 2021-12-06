import React, { useCallback, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../navigation/Navigation' was resolved ... Remove this comment to see the full error message
import { useNavigation } from '../../navigation/Navigation';
import { Row, RowWithMargins } from '../layout';
import { Text } from '../text';
import HeaderButton from './HeaderButton';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const DiscoverButtonShadowsFactory = (colors: any) => [
  [0, 7, 21, colors.shadow, 0.06],
  [0, 3.5, 10.5, colors.shadow, 0.04],
];

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const BackgroundFill = styled.View`
  ${position.cover};
  background-color: ${({ theme: { colors } }: any) => colors.white};
  opacity: 0.5;
`;

const BackgroundGradient = styled(LinearGradient).attrs(
  ({ theme: { colors } }) => ({
    colors: colors.gradients.offWhite,
    end: { x: 0.5, y: 1 },
    start: { x: 0.5, y: 0 },
  })
)`
  ${position.cover};
`;

const DiscoverButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 2,
})`
  align-items: center;
  justify-content: center;
  ${padding(2, 10, 7.5)};
  height: 34;
  z-index: 2;
`;

export default function DiscoverHeaderButton() {
  const { navigate } = useNavigation();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors, isDarkMode } = useTheme();

  const onPress = useCallback(() => navigate(Routes.QR_SCANNER_SCREEN), [
    navigate,
  ]);

  const onLongPress = useCallback(() => navigate(Routes.CONNECTED_DAPPS), [
    navigate,
  ]);

  const shadows = useMemo(() => DiscoverButtonShadowsFactory(colors), [colors]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <HeaderButton
      {...(__DEV__ ? { onLongPress } : {})}
      onPress={onPress}
      scaleTo={0.9}
      testID="discover-button"
      transformOrigin="right"
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={colors.white}
          borderRadius={50}
          shadows={shadows}
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          {...(android && {
            height: 35,
            width: 120,
          })}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BackgroundFill />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BackgroundGradient />
        </ShadowStack>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <DiscoverButtonContent>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text
            color={colors.alpha(colors.blueGreyDark, isDarkMode ? 1 : 0.8)}
            letterSpacing="roundedMedium"
            size="large"
            weight="bold"
            // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
            {...(android && { lineHeight: 32 })}
          >
            🪐 Discover
          </Text>
        </DiscoverButtonContent>
      </Row>
    </HeaderButton>
  );
}
