import { BlurView } from '@react-native-community/blur';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { Bleed, Box, BoxProps, Inline, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { position } from '@/styles';
import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useBrowserContext } from './BrowserContext';
import { useBrowserWorkletsContext } from './BrowserWorkletsContext';
import { BrowserButtonShadows } from './DappBrowserShadows';

export const TabViewToolbar = () => {
  const { tabViewProgress, tabViewVisible } = useBrowserContext();
  const { newTabWorklet, toggleTabViewWorklet } = useBrowserWorkletsContext();

  const barStyle = useAnimatedStyle(() => {
    return {
      opacity: tabViewProgress.value / 75,
      pointerEvents: tabViewVisible?.value ? 'box-none' : 'none',
      transform: [
        {
          scale: interpolate(tabViewProgress.value, [0, 100], [0.95, 1]),
        },
      ],
    };
  });

  return (
    <Box
      as={Animated.View}
      bottom={{ custom: 0 }}
      paddingHorizontal="16px"
      paddingTop="20px"
      pointerEvents="box-none"
      position="absolute"
      style={[{ height: TAB_BAR_HEIGHT + 86, zIndex: 10000 }]}
      width={{ custom: DEVICE_WIDTH }}
    >
      <Box
        as={Animated.View}
        style={[{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, barStyle]}
        width="full"
      >
        <Inline space={{ custom: 14 }}>
          <NewTabButton newTabWorklet={newTabWorklet} />
          {/* <CloseAllTabsButton /> */}
        </Inline>
        <DoneButton toggleTabViewWorklet={toggleTabViewWorklet} />
      </Box>
    </Box>
  );
};

const NewTabButton = ({ newTabWorklet }: { newTabWorklet: (newTabUrl?: string | undefined) => void }) => {
  return <BaseButton onPressWorklet={newTabWorklet} icon="􀅼" iconColor="label" iconSize="icon 20px" width={44} />;
};

const DoneButton = ({ toggleTabViewWorklet }: { toggleTabViewWorklet: (activeIndex?: number | undefined) => void }) => {
  return (
    <BaseButton onPressWorklet={toggleTabViewWorklet} paddingHorizontal="20px">
      <Text align="center" color="label" size="20pt" weight="heavy">
        {i18n.t(i18n.l.button.done)}
      </Text>
    </BaseButton>
  );
};

// const CloseAllTabsButton = () => {
//   const { closeAllTabsWorklet, currentlyOpenTabIds } = useBrowserContext();

//   const buttonStyle = useAnimatedStyle(() => {
//     const shouldDisplay = currentlyOpenTabIds.value.length > 1;
//     return {
//       opacity: withTiming(shouldDisplay ? 1 : 0, TIMING_CONFIGS.slowerFadeConfig),
//       pointerEvents: shouldDisplay ? 'auto' : 'none',
//     };
//   });

//   return (
//     <Animated.View style={buttonStyle}>
//       <BaseButton onPressWorklet={closeAllTabsWorklet} icon="􁒊" iconColor="label" iconSize="icon 20px" width={44} />
//     </Animated.View>
//   );
// };

type BaseButtonProps = {
  children?: React.ReactNode;
  icon?: string;
  iconColor?: TextColor;
  iconSize?: TextSize;
  iconWeight?: TextWeight;
  lightShadows?: boolean;
  onPress?: () => void;
  onPressWorklet?: () => void;
  paddingHorizontal?: BoxProps['paddingHorizontal'];
  scaleTo?: number;
  width?: number;
};

const BaseButton = ({
  children,
  icon,
  iconColor = 'labelSecondary',
  iconSize = 'icon 17px',
  iconWeight = 'heavy',
  lightShadows = true,
  onPress,
  onPressWorklet,
  paddingHorizontal = '16px',
  scaleTo,
  width,
}: BaseButtonProps) => {
  const { isDarkMode } = useColorMode();
  const fillSecondary = useForegroundColor('fillSecondary');
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const buttonColorIOS = isDarkMode ? fillSecondary : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const buttonColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;

  return (
    <BrowserButtonShadows lightShadows={lightShadows}>
      <Bleed space="8px">
        <HybridWorkletButton onPress={onPress} onPressWorklet={onPressWorklet} scaleTo={scaleTo} style={{ padding: 8 }}>
          <Box
            borderRadius={22}
            paddingHorizontal={width ? undefined : paddingHorizontal}
            style={{ borderCurve: 'continuous', height: 44, overflow: 'hidden', width }}
            alignItems="center"
            justifyContent="center"
          >
            {children || (
              <Text align="center" color={iconColor} size={iconSize} weight={iconWeight}>
                {icon}
              </Text>
            )}
            {IS_IOS && (
              <Box
                as={BlurView}
                blurAmount={20}
                blurType={isDarkMode ? 'dark' : 'light'}
                style={[
                  {
                    borderCurve: 'continuous',
                    borderRadius: 22,
                    elevation: -1,
                    overflow: 'hidden',
                    zIndex: -1,
                  },
                  position.coverAsObject,
                ]}
              />
            )}
            <Box
              style={[
                {
                  backgroundColor: buttonColor,
                  borderColor: separatorSecondary,
                  borderCurve: 'continuous',
                  borderRadius: 22,
                  borderWidth: IS_IOS && isDarkMode ? THICK_BORDER_WIDTH : 0,
                  overflow: 'hidden',
                  zIndex: -1,
                },
                position.coverAsObject,
              ]}
            />
          </Box>
        </HybridWorkletButton>
      </Bleed>
    </BrowserButtonShadows>
  );
};

type HybridButtonProps = {
  children?: React.ReactNode;
  onPress?: () => void;
  onPressWorklet?: () => void;
  scaleTo?: number;
  style?: StyleProp<ViewStyle>;
};

const HybridWorkletButton = ({ children, onPress, onPressWorklet, scaleTo, style }: HybridButtonProps) => {
  if (onPressWorklet) {
    return (
      <GestureHandlerV1Button onPressWorklet={onPressWorklet} scaleTo={scaleTo} style={style}>
        {children}
      </GestureHandlerV1Button>
    );
  } else if (onPress) {
    return (
      <ButtonPressAnimation onPress={onPress} scaleTo={scaleTo} style={style}>
        {children}
      </ButtonPressAnimation>
    );
  } else {
    return <>{children}</>;
  }
};
