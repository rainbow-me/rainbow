import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
import DiscoverSheetContext from './DiscoverSheetContext';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders, position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-vertical: 12;
  position: absolute;
  top: -12;
  width: 100%;
  z-index: 10;
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const ChildWrapperView = styled.View`
  position: absolute;
`;

export const FloatingActionButtonShadow = (colors: any) => [
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  [0, 10, android ? 0 : 30, colors.shadow, 0.5],
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  [0, 5, android ? 0 : 15, colors.shadow, 1],
];

const BackgroundFill = styled(Centered).attrs({
  ...borders.buildCircleAsObject(43),
})`
  ${position.cover};
  background-color: ${({ theme: { colors, isDarkMode } }) =>
    isDarkMode ? colors.darkModeDark : colors.blueGreyDark};
  left: 8;
  top: 8;
`;

const ALMOST_ZERO = 0.001;
const springConfig = {
  damping: 28,
  mass: 1,
  stiffness: 420,
};

function Stack({
  children,
  left,
  onPress,
  translateX = 0,
  isAboveMagicBorder,
  isWrapperVisible,
  isSearchModeEnabledValue,
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors, isDarkMode } = useTheme();
  const shadows = useMemo(() => FloatingActionButtonShadow(colors), [colors]);

  const styles1 = useAnimatedStyle(() => ({
    opacity: withSpring(
      isWrapperVisible.value && !isSearchModeEnabledValue.value
        ? 1
        : ALMOST_ZERO,
      springConfig
    ),
  }));

  const styles2 = useAnimatedStyle(() => ({
    opacity: withSpring(
      isAboveMagicBorder.value && !isSearchModeEnabledValue.value
        ? 1
        : ALMOST_ZERO,
      springConfig
    ),
  }));

  const styles3 = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(
          isWrapperVisible.value ? translateX : 0,
          springConfig
        ),
      },
    ],
  }));

  const styles4 = useAnimatedStyle(() => ({
    opacity: withSpring(isWrapperVisible.value ? 1 : ALMOST_ZERO, springConfig),
  }));

  const styles5 = useAnimatedStyle(() => ({
    opacity: withSpring(isWrapperVisible.value ? ALMOST_ZERO : 1, springConfig),
  }));

  const onPressWrapped = useCallback(() => {
    if (isAboveMagicBorder.value) {
      onPress();
    }
  }, [isAboveMagicBorder, onPress]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation
        onPress={onPressWrapped}
        style={{ height: 59, width: 59, zIndex: 10 }}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Animated.View
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
          height={59}
          position="absolute"
          style={styles1}
          width={59}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ShadowStack
            {...borders.buildCircleAsObject(43)}
            backgroundColor={isDarkMode ? colors.offWhite : colors.dark}
            shadows={shadows}
            style={{ left: 8, opacity: 0.4, position: 'absolute', top: 8 }}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BackgroundFill />
        </Animated.View>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Animated.View
          style={[
            styles2,
            {
              left,
              top: 19,
              zIndex: 10,
            },
          ]}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Animated.View style={styles3}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ChildWrapperView>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Animated.View style={styles5}>{children[0]}</Animated.View>
            </ChildWrapperView>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Animated.View style={styles4}>{children[1]}</Animated.View>
          </Animated.View>
        </Animated.View>
      </ButtonPressAnimation>
    </>
  );
}

export default function DiscoverSheetHeader(props: any) {
  const { navigate } = useNavigation();
  const buttonsEnabled = useSharedValue(true);
  const { yPosition } = props;
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'isSearchModeEnabled' does not exist on t... Remove this comment to see the full error message
  const { isSearchModeEnabled, setIsSearchModeEnabled } = useContext(
    DiscoverSheetContext
  );

  const isWrapperVisible = useDerivedValue(() => yPosition.value > 50);

  const isSearchModeEnabledValue = useDerivedValue(() => isSearchModeEnabled, [
    isSearchModeEnabled,
  ]);

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'jumpToShort' does not exist on type '{}'... Remove this comment to see the full error message
  const { jumpToShort, addOnCrossMagicBorderListener } =
    useContext(DiscoverSheetContext) || {};

  const onCrossMagicBorder = useCallback(
    below => {
      buttonsEnabled.value = !below;
    },
    [buttonsEnabled]
  );
  useEffect(() => addOnCrossMagicBorderListener?.(onCrossMagicBorder), [
    addOnCrossMagicBorderListener,
    onCrossMagicBorder,
  ]);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  const handleScannerPress = useCallback(() => {
    if (!isSearchModeEnabled) {
      setIsSearchModeEnabled?.(false);
      jumpToShort?.();
    }
  }, [isSearchModeEnabled, jumpToShort, setIsSearchModeEnabled]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Header {...props} pointerEvents="box-none">
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack
        isAboveMagicBorder={buttonsEnabled}
        isSearchModeEnabledValue={isSearchModeEnabledValue}
        isWrapperVisible={isWrapperVisible}
        left={19}
        onPress={() => !isSearchModeEnabled && navigate(Routes.WALLET_SCREEN)}
        translateX={5}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Icon
          color={colors.alpha(colors.blueGreyDark, 0.8)}
          direction="left"
          name="caret"
          {...props}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Icon
          color={colors.whiteLabel}
          direction="left"
          name="caret"
          {...props}
        />
      </Stack>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Stack
        isAboveMagicBorder={buttonsEnabled}
        isSearchModeEnabledValue={isSearchModeEnabledValue}
        isWrapperVisible={isWrapperVisible}
        left={18.5}
        onPress={handleScannerPress}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Icon
          bottom={1}
          color={colors.alpha(colors.blueGreyDark, 0.8)}
          name="scanner"
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Icon bottom={1} color={colors.whiteLabel} name="scanner" />
      </Stack>
    </Header>
  );
}
