import React, { useMemo, type ComponentProps } from 'react';
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import ConditionalWrap from 'conditional-wrap';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';

import { SheetHandleFixedToTop } from '@/components/sheet';
import { TapToDismiss } from '@/components/TapToDismiss';
import { Box, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';

export const PANEL_BACKGROUND_DARK = '#191A1C';
export const PANEL_BACKGROUND_LIGHT = globalColors.white100;
export const PANEL_BOTTOM_OFFSET = Math.max(safeAreaInsetValues.bottom, Platform.OS === 'ios' ? 8 : 30);
export const PANEL_INSET = 8;
export const PANEL_WIDTH = DEVICE_WIDTH - PANEL_INSET * 2;

const PANEL_BORDER_RADIUS = 42;

type PanelProps = {
  borderBottomRadius?: number;
  borderRadius?: number;
  borderTopRadius?: number;
  height?: number;
  horizontalPanelInset?: number;
  innerBorderColor?: string;
  innerBorderWidth?: number;
  layoutAnimation?: ComponentProps<typeof Animated.View>['layout'];
  outerBorderColor?: string;
  outerBorderWidth?: number;
  panelStyle?: StyleProp<ViewStyle> | AnimatedStyle;
};

const Panel = ({
  borderBottomRadius,
  borderRadius = PANEL_BORDER_RADIUS,
  borderTopRadius,
  children,
  height,
  horizontalPanelInset,
  innerBorderColor,
  innerBorderWidth,
  layoutAnimation,
  outerBorderColor,
  outerBorderWidth,
  panelStyle,
}: React.PropsWithChildren<PanelProps>) => {
  const { isDarkMode } = useColorMode();
  const separatorSecondary = useForegroundColor('separatorSecondary');

  const { borders, panelContainerStyle } = useMemo(() => {
    return {
      borders: isDarkMode ? (
        <Box
          style={[
            panelSheetStyles.panelBorderContainer,
            {
              borderColor: outerBorderColor || opacity(globalColors.grey100, 0.4),
              borderRadius,
              borderTopLeftRadius: borderTopRadius ?? borderRadius,
              borderTopRightRadius: borderTopRadius ?? borderRadius,
              borderBottomLeftRadius: borderBottomRadius ?? borderRadius,
              borderBottomRightRadius: borderBottomRadius ?? borderRadius,
            },
            outerBorderWidth !== undefined ? { borderWidth: outerBorderWidth } : undefined,
          ]}
        >
          <Box
            style={[
              panelSheetStyles.panelBorder,
              {
                borderColor: innerBorderColor || separatorSecondary,
                borderRadius: borderRadius - 2 / 3,
                borderTopLeftRadius: (borderTopRadius ?? borderRadius) - 2 / 3,
                borderTopRightRadius: (borderTopRadius ?? borderRadius) - 2 / 3,
                borderBottomLeftRadius: (borderBottomRadius ?? borderRadius) - 2 / 3,
                borderBottomRightRadius: (borderBottomRadius ?? borderRadius) - 2 / 3,
              },
              innerBorderWidth !== undefined ? { borderWidth: innerBorderWidth } : undefined,
            ]}
          />
        </Box>
      ) : null,

      panelContainerStyle: [
        panelSheetStyles.panel,
        isDarkMode ? panelSheetStyles.panelBackgroundDark : panelSheetStyles.panelBackgroundLight,
        {
          borderRadius,
          borderTopLeftRadius: borderTopRadius ?? borderRadius,
          borderTopRightRadius: borderTopRadius ?? borderRadius,
          borderBottomLeftRadius: borderBottomRadius ?? borderRadius,
          borderBottomRightRadius: borderBottomRadius ?? borderRadius,
          height,
          width: horizontalPanelInset ? DEVICE_WIDTH - horizontalPanelInset * 2 : PANEL_WIDTH,
        },
      ],
    };
  }, [
    borderBottomRadius,
    borderRadius,
    borderTopRadius,
    height,
    horizontalPanelInset,
    innerBorderColor,
    innerBorderWidth,
    isDarkMode,
    outerBorderColor,
    outerBorderWidth,
    separatorSecondary,
  ]);

  return (
    <Animated.View layout={layoutAnimation} style={[panelContainerStyle, panelStyle]}>
      {children}
      {borders}
    </Animated.View>
  );
};

type PanelSheetProps = PanelProps & {
  bottomOffset?: number;
  containerStyle?: StyleProp<ViewStyle>;
  handleProps?: Partial<ComponentProps<typeof SheetHandleFixedToTop>>;
  layoutAnimation?: ComponentProps<typeof Animated.View>['layout'];
  showHandle?: boolean;
  showTapToDismiss?: boolean;
  panelStyle?: StyleProp<ViewStyle> | AnimatedStyle;
  enableKeyboardAvoidance?: boolean;
  keyboardAvoidanceOffset?: { closed?: number; opened?: number };
};

export const DEFAULT_HANDLE_COLOR_DARK = 'rgba(245, 248, 255, 0.3)';
export const DEFAULT_HANDLE_COLOR_LIGHT = 'rgba(59, 66, 83, 0.3)';

const DEFAULT_HANDLE_SHOW_BLUR = true;
const DEFAULT_HANDLE_TOP = 14;

export const PanelSheet = ({
  borderBottomRadius,
  borderRadius,
  borderTopRadius,
  bottomOffset = PANEL_BOTTOM_OFFSET,
  children,
  containerStyle,
  handleProps,
  height,
  horizontalPanelInset,
  innerBorderColor,
  innerBorderWidth,
  layoutAnimation,
  outerBorderColor,
  outerBorderWidth,
  showHandle = true,
  showTapToDismiss = true,
  panelStyle,
  enableKeyboardAvoidance = false,
  keyboardAvoidanceOffset,
}: React.PropsWithChildren<PanelSheetProps>) => {
  const { isDarkMode } = useColorMode();
  return (
    <>
      <Animated.View layout={layoutAnimation} style={[panelSheetStyles.panelContainer, { bottom: bottomOffset }, containerStyle]}>
        <ConditionalWrap
          wrap={children => <KeyboardStickyView offset={keyboardAvoidanceOffset}>{children}</KeyboardStickyView>}
          condition={enableKeyboardAvoidance}
        >
          <>
            {showHandle && (
              <SheetHandleFixedToTop
                color={handleProps?.color ?? (isDarkMode ? DEFAULT_HANDLE_COLOR_DARK : DEFAULT_HANDLE_COLOR_LIGHT)}
                showBlur={handleProps?.showBlur ?? DEFAULT_HANDLE_SHOW_BLUR}
                top={handleProps?.top ?? DEFAULT_HANDLE_TOP}
              />
            )}
            <Panel
              borderBottomRadius={borderBottomRadius}
              borderRadius={borderRadius}
              borderTopRadius={borderTopRadius}
              height={height}
              horizontalPanelInset={horizontalPanelInset}
              innerBorderColor={innerBorderColor}
              innerBorderWidth={innerBorderWidth}
              layoutAnimation={layoutAnimation}
              outerBorderColor={outerBorderColor}
              outerBorderWidth={outerBorderWidth}
              panelStyle={panelStyle}
            >
              {children}
            </Panel>
          </>
        </ConditionalWrap>
      </Animated.View>
      {showTapToDismiss && <TapToDismiss />}
    </>
  );
};

const panelSheetStyles = StyleSheet.create({
  panelContainer: {
    alignItems: 'center',
    bottom: 91,
    pointerEvents: 'box-none',
    position: 'absolute',
    width: '100%',
    zIndex: 30000,
  },
  panelBorder: {
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderWidth: THICK_BORDER_WIDTH,
    height: '100%',
    overflow: 'hidden',
    position: 'absolute',
    width: '100%',
  },
  panelBorderContainer: {
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderWidth: 2 / 3,
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
  },
  panel: {
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  panelBackgroundDark: {
    backgroundColor: PANEL_BACKGROUND_DARK,
  },
  panelBackgroundLight: {
    backgroundColor: PANEL_BACKGROUND_LIGHT,
  },
});
