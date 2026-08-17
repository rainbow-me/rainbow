import React, { memo, useEffect } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import Animated, { Easing, FadeIn, FadeOut, LinearTransition, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { AbsolutePortal } from '@/components/AbsolutePortal';
import { HourglassAnimation } from '@/components/animations/HourglassAnimation';
import { PANEL_BACKGROUND_DARK, PANEL_BACKGROUND_LIGHT, PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Text, useColorMode, useForegroundColor } from '@/design-system';

import { useCashHalfSheetVisibilityStore } from '../stores/cashHalfSheetVisibilityStore';
import { CashActionButton } from './CashActionButton';

type HalfSheetAction = {
  label: string;
  onPress: () => void;
  testID: string;
};

type CommonProps = {
  description: string;
  testID: string;
  title: string;
};

type CashStatusHalfSheetProps = CommonProps &
  (
    | { status: 'inProgress' }
    | { status: 'reviewing'; action: HalfSheetAction }
    | { status: 'success'; action: HalfSheetAction; successIcon: string }
    | { status: 'error'; primaryAction: HalfSheetAction; secondaryAction?: HalfSheetAction }
    | { status: 'warning'; primaryAction: HalfSheetAction; secondaryAction: HalfSheetAction }
  );

const STATUS_ICONS = {
  error: '􀁠',
  reviewing: '􀐫',
  warning: '􀇾',
} as const;

const STATUS_ICON_COLORS = {
  error: 'red',
  reviewing: 'blue',
  success: 'green',
  warning: 'red',
} as const;

const PANEL_ENTERING_ANIMATION = SlideInDown.springify().damping(70).mass(0.8).stiffness(500);
const PANEL_EXITING_ANIMATION = SlideOutDown.springify().damping(70).mass(0.8).stiffness(500);
const PANEL_RESIZE_ANIMATION = LinearTransition.duration(200).easing(Easing.inOut(Easing.ease));

export const CashStatusHalfSheet = memo(function CashStatusHalfSheet(props: CashStatusHalfSheetProps) {
  const isAlert = props.status === 'error' || props.status === 'warning';
  const { isDarkMode } = useColorMode();
  const blue = useForegroundColor('blue');
  const panelColor = isDarkMode ? PANEL_BACKGROUND_DARK : PANEL_BACKGROUND_LIGHT;

  useEffect(() => {
    // A keyboard would cover the sheet, whose backdrop blocks any way to close it.
    Keyboard.dismiss();
    const { register, unregister } = useCashHalfSheetVisibilityStore.getState();
    register();
    return unregister;
  }, []);

  return (
    <AbsolutePortal>
      <View accessibilityViewIsModal style={styles.overlay} testID={`${props.testID}-overlay`}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.backdrop} />
        <Animated.View entering={PANEL_ENTERING_ANIMATION} exiting={PANEL_EXITING_ANIMATION} style={styles.panelHost}>
          <PanelSheet layoutAnimation={PANEL_RESIZE_ANIMATION} showHandle={false} showTapToDismiss={false}>
            <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(160)} key={props.status}>
              <Box paddingBottom={props.status === 'inProgress' ? '32px' : '20px'} paddingHorizontal="32px" paddingTop="52px">
                <Box height={{ custom: 64 }} justifyContent="center">
                  {props.status === 'inProgress' ? (
                    <HourglassAnimation backgroundColor={panelColor} color={blue} sandColor={panelColor} showBadge={false} />
                  ) : (
                    <Text
                      color={STATUS_ICON_COLORS[props.status]}
                      size="44pt"
                      style={[styles.icon, isAlert && styles.alertIcon]}
                      weight="heavy"
                    >
                      {props.status === 'success' ? props.successIcon : STATUS_ICONS[props.status]}
                    </Text>
                  )}
                </Box>

                <Box gap={24} paddingTop="32px">
                  <Text color="label" size="26pt" weight="heavy">
                    {props.title}
                  </Text>
                  <Text color="labelQuaternary" size="17pt / 135%" weight="bold">
                    {props.description}
                  </Text>
                </Box>

                {props.status === 'success' && (
                  <Box paddingTop="32px">
                    <CashActionButton label={props.action.label} onPress={props.action.onPress} shadow testID={props.action.testID} />
                  </Box>
                )}

                {props.status === 'reviewing' && (
                  <Box paddingTop="32px">
                    <CashActionButton
                      label={props.action.label}
                      onPress={props.action.onPress}
                      testID={props.action.testID}
                      variant="tinted"
                    />
                  </Box>
                )}

                {isAlert && (
                  <Box gap={16} paddingTop="32px">
                    <CashActionButton
                      label={props.primaryAction.label}
                      onPress={props.primaryAction.onPress}
                      testID={props.primaryAction.testID}
                      variant="tinted"
                    />
                    {props.secondaryAction && (
                      <CashActionButton
                        color={props.status === 'warning' ? 'red' : 'blue'}
                        label={props.secondaryAction.label}
                        onPress={props.secondaryAction.onPress}
                        testID={props.secondaryAction.testID}
                        variant="plain"
                      />
                    )}
                  </Box>
                )}
              </Box>
            </Animated.View>
          </PanelSheet>
        </Animated.View>
      </View>
    </AbsolutePortal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.44)',
  },
  alertIcon: {
    fontSize: 46,
  },
  icon: {
    fontSize: 54,
    lineHeight: 64,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  panelHost: {
    ...StyleSheet.absoluteFillObject,
  },
});
