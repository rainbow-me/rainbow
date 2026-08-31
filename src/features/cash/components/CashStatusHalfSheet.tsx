import React, { memo, useEffect } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import Animated, { Easing, FadeIn, FadeOut, LinearTransition, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { AbsolutePortal } from '@/components/AbsolutePortal';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Text } from '@/design-system';

import { useCashHalfSheetVisibilityStore } from '../stores/cashHalfSheetVisibilityStore';
import { CashActionButton } from './CashActionButton';

type HalfSheetAction = {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onPress: () => void;
  testID: string;
};

type CommonProps = {
  description: string;
  testID: string;
  title: string;
};

type CashStatusPanelContent = CommonProps &
  (
    | { status: 'inProgress' }
    | { status: 'reviewing'; action: HalfSheetAction }
    | { status: 'success'; action: HalfSheetAction; successIcon: string }
    | { status: 'error'; primaryAction: HalfSheetAction; secondaryAction?: HalfSheetAction }
    | { status: 'warning'; primaryAction: HalfSheetAction; secondaryAction: HalfSheetAction }
  );

const STATUS_ICONS = {
  error: '􀁠',
  inProgress: '􀖇',
  reviewing: '􀐫',
  warning: '􀇾',
} as const;

const STATUS_ICON_COLORS = {
  error: 'red',
  inProgress: 'blue',
  reviewing: 'blue',
  success: 'green',
  warning: 'red',
} as const;

const PANEL_ENTERING_ANIMATION = SlideInDown.springify().damping(70).mass(0.8).stiffness(500);
const PANEL_EXITING_ANIMATION = SlideOutDown.springify().damping(70).mass(0.8).stiffness(500);
const PANEL_RESIZE_ANIMATION = LinearTransition.duration(200).easing(Easing.inOut(Easing.ease));

export function CashStatusPanel({ content: props }: { content: CashStatusPanelContent }) {
  const icon = props.status === 'success' ? props.successIcon : STATUS_ICONS[props.status];
  const iconColor = STATUS_ICON_COLORS[props.status];
  const isAlert = props.status === 'error' || props.status === 'warning';

  return (
    <PanelSheet handleProps={{ showBlur: false, top: 8 }} layoutAnimation={PANEL_RESIZE_ANIMATION} showTapToDismiss={false}>
      <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(160)} key={props.status} testID={props.testID}>
        <Box paddingBottom={props.status === 'inProgress' ? '32px' : '20px'} paddingHorizontal="32px" paddingTop="52px">
          <Box height={{ custom: 64 }} justifyContent="center">
            <Text color={iconColor} size="44pt" style={[styles.icon, isAlert && styles.alertIcon]} weight="heavy">
              {icon}
            </Text>
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
              <CashActionButton {...props.action} shadow />
            </Box>
          )}

          {props.status === 'reviewing' && (
            <Box paddingTop="32px">
              <CashActionButton {...props.action} variant="tinted" />
            </Box>
          )}

          {isAlert && (
            <Box gap={16} paddingTop="32px">
              <CashActionButton {...props.primaryAction} variant="tinted" />
              {props.secondaryAction && (
                <CashActionButton {...props.secondaryAction} color={props.status === 'warning' ? 'red' : 'blue'} variant="plain" />
              )}
            </Box>
          )}
        </Box>
      </Animated.View>
    </PanelSheet>
  );
}

export const CashStatusHalfSheet = memo(function CashStatusHalfSheet(props: CashStatusPanelContent) {
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
          <CashStatusPanel content={props} />
        </Animated.View>
      </View>
    </AbsolutePortal>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
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
    ...StyleSheet.absoluteFill,
  },
  panelHost: {
    ...StyleSheet.absoluteFill,
  },
});
