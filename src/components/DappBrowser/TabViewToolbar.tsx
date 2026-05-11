import React from 'react';
import { Platform } from 'react-native';

import { BlurView } from 'react-native-blur-view';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { type HapticType } from 'react-native-turbo-haptics';

import { clamp } from '@/__swaps__/utils/swaps';
import { GestureHandlerButton } from '@/components/buttons/GestureHandlerButton';
import { Bleed, Box, globalColors, Text, useColorMode, useForegroundColor, type BoxProps } from '@/design-system';
import { type TextColor } from '@/design-system/color/palettes';
import { type TextWeight } from '@/design-system/components/Text/Text';
import { type TextSize } from '@/design-system/typography/typeHierarchy';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { position } from '@/styles';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';

import { useBrowserContext } from './BrowserContext';
import { useBrowserWorkletsContext } from './BrowserWorkletsContext';
import { BrowserButtonShadows } from './DappBrowserShadows';
import { type BrowserWorkletsContextType } from './types';

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
    <BaseButton onPressWorklet={toggleTabViewWorklet} paddingHorizontal="20px">
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
  disableHaptics = false,
  hapticType,
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
  const buttonColor = Platform.OS === 'ios' ? buttonColorIOS : buttonColorAndroid;

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
          style={{ padding: 8 }}
        >
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
            {Platform.OS === 'ios' && (
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
                  backgroundColor: buttonColor,
                  borderColor: separatorSecondary,
                  borderCurve: 'continuous',
                  borderRadius: 22,
                  borderWidth: Platform.OS === 'ios' && isDarkMode ? THICK_BORDER_WIDTH : 0,
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
