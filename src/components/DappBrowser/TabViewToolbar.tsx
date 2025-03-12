import React from 'react';
import { BlurView } from 'react-native-blur-view';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { HapticType } from 'react-native-turbo-haptics';
import { Bleed, Box, BoxProps, Text, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { ForegroundColor, TextColor } from '@/design-system/color/palettes';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { IS_IOS } from '@/env';
import * as i18n from '@/languages';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { position } from '@/styles';
import { GestureHandlerButton, GestureHandlerButtonProps } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { clamp, opacity } from '@/__swaps__/utils/swaps';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useBrowserContext } from './BrowserContext';
import { useBrowserWorkletsContext } from './BrowserWorkletsContext';
import { BrowserButtonShadows } from './DappBrowserShadows';
import { BrowserWorkletsContextType } from './types';
import { CustomColor } from '@/design-system/color/useForegroundColor';

export const TabViewToolbar = () => {
  const { extraWebViewHeight, tabViewProgress, tabViewVisible } = useBrowserContext();
  const { newTabWorklet, toggleTabViewWorklet } = useBrowserWorkletsContext();

  const barStyle = useAnimatedStyle(() => {
    return {
      opacity: clamp(tabViewProgress.value / 75, 0, 1),
      pointerEvents: tabViewVisible?.value ? 'box-none' : 'none',
      transform: [
        {
          translateY: extraWebViewHeight.value,
        },
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
      style={{ height: TAB_BAR_HEIGHT + 86, zIndex: 10000 }}
      width={{ custom: DEVICE_WIDTH }}
    >
      <Box
        as={Animated.View}
        style={[{ alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, barStyle]}
        width="full"
      >
        <NewTabButton newTabWorklet={newTabWorklet} />
        <DoneButton toggleTabViewWorklet={toggleTabViewWorklet} />
      </Box>
    </Box>
  );
};

const NewTabButton = ({ newTabWorklet }: { newTabWorklet: BrowserWorkletsContextType['newTabWorklet'] }) => {
  return <BaseButton onPressWorklet={newTabWorklet} icon="􀅼" iconColor="label" iconSize="icon 20px" width={44} />;
};

const DoneButton = ({ toggleTabViewWorklet }: { toggleTabViewWorklet: (activeIndex?: number | undefined) => void }) => {
  return (
    <BaseButton gestureButtonProps={{ style: { padding: 8 } }} onPressWorklet={toggleTabViewWorklet} paddingHorizontal="20px">
      <Text align="center" color="label" size="20pt" weight="heavy">
        {i18n.t(i18n.l.button.done)}
      </Text>
    </BaseButton>
  );
};

type BaseButtonProps = {
  children?: React.ReactNode;
  disableHaptics?: boolean;
  hapticType?: HapticType;
  buttonColor?: ForegroundColor | 'accent' | CustomColor;
  borderColor?: ForegroundColor | 'accent' | CustomColor;
  icon?: string;
  iconColor?: TextColor;
  iconSize?: TextSize;
  iconWeight?: TextWeight;
  lightShadows?: boolean;
  onPress?: () => void;
  onPressWorklet?: () => void;
  paddingVertical?: BoxProps['paddingVertical'];
  paddingHorizontal?: BoxProps['paddingHorizontal'];
  scaleTo?: number;
  width?: number;
  gestureButtonProps?: Partial<GestureHandlerButtonProps>;
};

export const BaseButton = ({
  children,
  disableHaptics = false,
  hapticType,
  buttonColor = 'fillSecondary',
  borderColor = 'separatorSecondary',
  icon,
  iconColor = 'labelSecondary',
  iconSize = 'icon 17px',
  iconWeight = 'heavy',
  lightShadows = true,
  onPress,
  onPressWorklet,
  paddingVertical = { custom: 15 },
  paddingHorizontal = '16px',
  scaleTo,
  width,
  gestureButtonProps,
}: BaseButtonProps) => {
  const { isDarkMode } = useColorMode();
  const _buttonColor = useForegroundColor(buttonColor);
  const _borderColor = useForegroundColor(borderColor);

  const buttonColorIOS = isDarkMode ? _buttonColor : opacity(globalColors.white100, 0.9);
  const buttonColorAndroid = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;
  const btnColor = IS_IOS ? buttonColorIOS : buttonColorAndroid;

  return (
    <BrowserButtonShadows lightShadows={lightShadows}>
      <Bleed space="8px">
        <GestureHandlerButton
          disableHaptics={disableHaptics}
          hapticType={hapticType}
          onPressJS={onPress}
          onPressWorklet={() => {
            'worklet';
            onPressWorklet?.();
          }}
          scaleTo={scaleTo}
          {...gestureButtonProps}
        >
          <Box
            borderRadius={22}
            paddingHorizontal={width ? undefined : paddingHorizontal}
            paddingVertical={paddingVertical}
            style={{ borderCurve: 'continuous', overflow: 'hidden', width }}
            alignItems="center"
            justifyContent="center"
          >
            {children || (
              <Text align="center" color={iconColor} size={iconSize} weight={iconWeight}>
                {icon}
              </Text>
            )}
            {IS_IOS && (
              <BlurView
                blurIntensity={20}
                blurStyle={isDarkMode ? 'dark' : 'light'}
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
                  backgroundColor: btnColor,
                  borderColor: _borderColor,
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
        </GestureHandlerButton>
      </Bleed>
    </BrowserButtonShadows>
  );
};
