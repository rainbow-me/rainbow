import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View } from 'react-native';
import {
  runOnJS,
  Transition,
  Transitioning,
  useAnimatedReaction,
  useSharedValue,
} from 'react-native-reanimated';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered } from '../layout';
import DiscoverSheetContext from './DiscoverSheetContext';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { borders, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const Header = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-vertical: 12;
  position: absolute;
  top: -12;
  width: 100%;
  z-index: 10;
`;

export const FloatingActionButtonShadow = colors => [
  [0, 10, android ? 0 : 30, colors.shadow, 0.5],
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

const transition = (
  <Transition.Together>
    <Transition.In type="fade" />
    <Transition.Out type="fade" />
    <Transition.Change interpolation="easeInOut" />
  </Transition.Together>
);

let key = 0;

function TransitioningView(props) {
  const ref = useRef();
  return (
    <Transitioning.View animateMount key={`tv${key++}`} ref={ref} {...props} />
  );
}

function Stack({
  children,
  left,
  onPress,
  disabled,
  translateX = 0,
  isAboveMagicBorder,
  isWrapperVisible,
}) {
  const { colors, isDarkMode } = useTheme();
  const shadows = useMemo(() => FloatingActionButtonShadow(colors), [colors]);

  return (
    <>
      <ButtonPressAnimation
        disabled={disabled}
        onPress={onPress}
        style={{ height: 59, width: 59, zIndex: 10 }}
      >
        <TransitioningView
          height={59}
          position="absolute"
          style={{ opacity: isWrapperVisible ? 1 : 0 }}
          transition={transition}
          width={59}
        >
          <ShadowStack
            {...borders.buildCircleAsObject(43)}
            backgroundColor={isDarkMode ? colors.offWhite : colors.dark}
            shadows={shadows}
            style={{ left: 8, opacity: 0.4, position: 'absolute', top: 8 }}
          />
          <BackgroundFill />
        </TransitioningView>
        <View
          style={[
            {
              left,
              opacity: isAboveMagicBorder ? 1 : 0,
              top: 19,
              zIndex: 10,
            },
          ]}
        >
          <TransitioningView
            style={{
              transform: [{ translateX: isWrapperVisible ? translateX : 0 }],
            }}
          >
            <View
              style={{
                position: 'absolute',
              }}
            >
              {children[0]}
            </View>
            <View style={{ opacity: isWrapperVisible ? 1 : 0 }}>
              {children[1]}
            </View>
          </TransitioningView>
        </View>
      </ButtonPressAnimation>
    </>
  );
}

export default function DiscoverSheetHeader(props) {
  const { navigate } = useNavigation();
  const [buttonsEnabled, setButtonsEnabled] = useState(true);
  const [isScrollViewScrolled, setIsScrollViewScrolled] = useState(true);
  const buttonOpacity = useSharedValue(1);
  const { yPosition } = props;
  const { isSearchModeEnabled, setIsSearchModeEnabled } = useContext(
    DiscoverSheetContext
  );

  useAnimatedReaction(
    () => yPosition.value < 50,
    (result, previous) => {
      if (result !== previous) {
        runOnJS(setIsScrollViewScrolled)(result);
      }
    },
    [setIsScrollViewScrolled]
  );

  const { jumpToShort, addOnCrossMagicBorderListener } =
    useContext(DiscoverSheetContext) || {};

  const onCrossMagicBorder = useCallback(
    below => {
      buttonOpacity.value = below ? 0 : 1;
      setButtonsEnabled(!below);
    },
    [buttonOpacity]
  );
  useEffect(() => addOnCrossMagicBorderListener?.(onCrossMagicBorder), [
    addOnCrossMagicBorderListener,
    onCrossMagicBorder,
  ]);

  const { colors } = useTheme();

  const handleScannerPress = useCallback(() => {
    if (!isSearchModeEnabled) {
      setIsSearchModeEnabled?.(false);
      jumpToShort?.();
    }
  }, [isSearchModeEnabled, jumpToShort, setIsSearchModeEnabled]);

  return (
    <Header {...props} pointerEvents="box-none">
      <Stack
        disabled={!buttonsEnabled}
        isAboveMagicBorder={buttonsEnabled}
        isWrapperVisible={isSearchModeEnabled || !isScrollViewScrolled}
        left={19}
        onPress={() => !isSearchModeEnabled && navigate(Routes.WALLET_SCREEN)}
        translateX={5}
      >
        <Icon
          bottom={1}
          color={colors.alpha(colors.blueGreyDark, 0.8)}
          direction="left"
          name="caret"
          {...props}
        />
        <Icon
          color={colors.whiteLabel}
          direction="left"
          name="caret"
          {...props}
        />
      </Stack>
      <Stack
        disabled={!buttonsEnabled}
        isAboveMagicBorder={buttonsEnabled}
        isWrapperVisible={isSearchModeEnabled || !isScrollViewScrolled}
        left={18.5}
        onPress={handleScannerPress}
      >
        <Icon
          bottom={1}
          color={colors.alpha(colors.blueGreyDark, 0.8)}
          name="scanner"
        />
        <Icon bottom={1} color={colors.whiteLabel} name="scanner" />
      </Stack>
    </Header>
  );
}
