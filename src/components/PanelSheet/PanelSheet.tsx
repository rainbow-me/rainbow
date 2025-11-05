import React, { ComponentProps, memo, useMemo } from 'react';
import { StyleProp, StyleSheet, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { Box, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { SheetHandleFixedToTop } from '@/components/sheet';
import { IS_IOS } from '@/env';
import { useNavigation } from '@/navigation';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { safeAreaInsetValues } from '@/utils';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import ConditionalWrap from 'conditional-wrap';

export const TapToDismiss = memo(function TapToDismiss() {
  const { goBack } = useNavigation();

  return (
    <TouchableWithoutFeedback onPress={goBack}>
      <View style={panelSheetStyles.cover} />
    </TouchableWithoutFeedback>
  );
});

const PANEL_INSET = 8;
const PANEL_WIDTH = DEVICE_WIDTH - PANEL_INSET * 2;
export const PANEL_BACKGROUND_LIGHT = globalColors.white100;
export const PANEL_BACKGROUND_DARK = '#191A1C';
export const PANEL_BOTTOM_OFFSET = Math.max(safeAreaInsetValues.bottom + 5, IS_IOS ? 8 : 30);

const PANEL_BORDER_RADIUS = 42;

type PanelProps = {
  height?: number;
  innerBorderColor?: string;
  innerBorderWidth?: number;
  outerBorderColor?: string;
  outerBorderWidth?: number;
  panelStyle?: StyleProp<ViewStyle> | AnimatedStyle;
};

const Panel = ({
  children,
  height,
  innerBorderColor,
  innerBorderWidth,
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
            { borderColor: outerBorderColor || opacity(globalColors.grey100, 0.4) },
            outerBorderWidth !== undefined ? { borderWidth: outerBorderWidth } : undefined,
          ]}
        >
          <Box
            style={[
              panelSheetStyles.panelBorder,
              { borderColor: innerBorderColor || separatorSecondary },
              innerBorderWidth !== undefined ? { borderWidth: innerBorderWidth } : undefined,
            ]}
          />
        </Box>
      ) : null,

      panelContainerStyle: [
        panelSheetStyles.panel,
        isDarkMode ? panelSheetStyles.panelBackgroundDark : panelSheetStyles.panelBackgroundLight,
        { height },
      ],
    };
  }, [height, innerBorderColor, innerBorderWidth, isDarkMode, outerBorderColor, outerBorderWidth, separatorSecondary]);

  return (
    <Animated.View style={[panelContainerStyle, panelStyle]}>
      {children}
      {borders}
    </Animated.View>
  );
};

type PanelSheetProps = PanelProps & {
  bottomOffset?: number;
  containerStyle?: StyleProp<ViewStyle>;
  handleProps?: Partial<ComponentProps<typeof SheetHandleFixedToTop>>;
  showHandle?: boolean;
  showTapToDismiss?: boolean;
  panelStyle?: StyleProp<ViewStyle> | AnimatedStyle;
  enableKeyboardAvoidance?: boolean;
};

const DEFAULT_HANDLE_TOP = 14;
const DEFAULT_HANDLE_SHOW_BLUR = true;
const DEFAULT_HANDLE_COLOR_DARK = 'rgba(245, 248, 255, 0.3)';
const DEFAULT_HANDLE_COLOR_LIGHT = 'rgba(59, 66, 83, 0.3)';

export const PanelSheet = ({
  bottomOffset = PANEL_BOTTOM_OFFSET,
  children,
  containerStyle,
  handleProps,
  height,
  innerBorderColor,
  innerBorderWidth,
  outerBorderColor,
  outerBorderWidth,
  showHandle = true,
  showTapToDismiss = true,
  panelStyle,
  enableKeyboardAvoidance = false,
}: React.PropsWithChildren<PanelSheetProps>) => {
  const { isDarkMode } = useColorMode();

  const resolvedHandleProps = {
    showBlur: handleProps?.showBlur ?? DEFAULT_HANDLE_SHOW_BLUR,
    color: handleProps?.color ?? (isDarkMode ? DEFAULT_HANDLE_COLOR_DARK : DEFAULT_HANDLE_COLOR_LIGHT),
    top: handleProps?.top ?? DEFAULT_HANDLE_TOP,
  } satisfies ComponentProps<typeof SheetHandleFixedToTop>;

  return (
    <>
      <Box style={[panelSheetStyles.panelContainer, { bottom: bottomOffset }, containerStyle]}>
        <ConditionalWrap wrap={children => <KeyboardStickyView>{children}</KeyboardStickyView>} condition={enableKeyboardAvoidance}>
          <>
            {/* eslint-disable-next-line react/jsx-props-no-spreading */}
            {showHandle && <SheetHandleFixedToTop {...resolvedHandleProps} />}
            <Panel
              height={height}
              innerBorderColor={innerBorderColor}
              innerBorderWidth={innerBorderWidth}
              outerBorderColor={outerBorderColor}
              outerBorderWidth={outerBorderWidth}
              panelStyle={panelStyle}
            >
              {children}
            </Panel>
          </>
        </ConditionalWrap>
      </Box>
      {showTapToDismiss && <TapToDismiss />}
    </>
  );
};

const panelSheetStyles = StyleSheet.create({
  cover: {
    bottom: 0,
    height: DEVICE_HEIGHT,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: DEVICE_WIDTH,
  },
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
    borderRadius: PANEL_BORDER_RADIUS - 2 / 3,
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
    borderRadius: PANEL_BORDER_RADIUS,
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
  },
  panel: {
    borderCurve: 'continuous',
    borderRadius: PANEL_BORDER_RADIUS,
    overflow: 'hidden',
    width: PANEL_WIDTH,
  },
  panelBackgroundDark: {
    backgroundColor: PANEL_BACKGROUND_DARK,
  },
  panelBackgroundLight: {
    backgroundColor: PANEL_BACKGROUND_LIGHT,
  },
});
