import React, { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View, LayoutChangeEvent, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { Box, globalColors, HitSlop, Text } from '@/design-system';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';
import { ButtonPressAnimation } from '@/components/animations';
import { BlurView } from '@react-native-community/blur';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';

// which side of the child the tooltip is on
type Side = 'top' | 'bottom';

// which side of the tooltip is aligned to the child
type Align = 'start' | 'center' | 'end';
interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TOOLTIP_HEIGHT = 68;
const TOOLTIP_MAX_WIDTH = 350;
const TOOLTIP_PADDING = 16;
const ARROW_SIZE = 10;
const BORDER_RADIUS = 24;
const ICON_SIZE = 36;

/*
  This draws the entire tooltip, including the arrow, in one path 
  This allows the arrow to blend into the tooltip background nicely
*/
const calculateTooltipPath = (side: Side, align: Align, width: number): string => {
  'worklet';

  const height = TOOLTIP_HEIGHT + ARROW_SIZE;
  const arrowWidth = ARROW_SIZE * 2;
  const arrowHeight = ARROW_SIZE;
  const arrowCornerRadius = 4;

  // Calculate arrow center position based on alignment
  let arrowCenter;
  switch (align) {
    case 'start':
      arrowCenter = BORDER_RADIUS * 1.5;
      break;
    case 'center':
      arrowCenter = width * 0.5;
      break;
    case 'end':
      arrowCenter = width - BORDER_RADIUS * 1.5;
      break;
    default:
      arrowCenter = width * 0.5;
  }

  const arrowLeft = arrowCenter - arrowWidth / 2;
  const arrowRight = arrowCenter + arrowWidth / 2;

  switch (side) {
    case 'bottom': // Tooltip box below child, arrow at top
      return `
        M ${BORDER_RADIUS},${arrowHeight}
        H ${arrowLeft}
        Q ${arrowLeft},${arrowHeight} ${arrowLeft + arrowCornerRadius},${arrowHeight - arrowCornerRadius}
        L ${arrowCenter - arrowCornerRadius},${arrowCornerRadius}
        Q ${arrowCenter},0 ${arrowCenter + arrowCornerRadius},${arrowCornerRadius}
        L ${arrowRight - arrowCornerRadius},${arrowHeight - arrowCornerRadius}
        Q ${arrowRight},${arrowHeight} ${arrowRight},${arrowHeight}
        H ${width - BORDER_RADIUS}
        Q ${width},${arrowHeight} ${width},${arrowHeight + BORDER_RADIUS}
        V ${height - BORDER_RADIUS}
        Q ${width},${height} ${width - BORDER_RADIUS},${height}
        H ${BORDER_RADIUS}
        Q 0,${height} 0,${height - BORDER_RADIUS}
        V ${arrowHeight + BORDER_RADIUS}
        Q 0,${arrowHeight} ${BORDER_RADIUS},${arrowHeight}
      `;
    case 'top': // Tooltip box above child, arrow at bottom
      return `
        M ${BORDER_RADIUS},0
        H ${width - BORDER_RADIUS}
        Q ${width},0 ${width},${BORDER_RADIUS}
        V ${height - arrowHeight - BORDER_RADIUS}
        Q ${width},${height - arrowHeight} ${width - BORDER_RADIUS},${height - arrowHeight}
        H ${arrowRight}
        Q ${arrowRight},${height - arrowHeight} ${arrowRight - arrowCornerRadius},${height - arrowHeight + arrowCornerRadius}
        L ${arrowCenter + arrowCornerRadius},${height - arrowCornerRadius}
        Q ${arrowCenter},${height} ${arrowCenter - arrowCornerRadius},${height - arrowCornerRadius}
        L ${arrowLeft + arrowCornerRadius},${height - arrowHeight + arrowCornerRadius}
        Q ${arrowLeft},${height - arrowHeight} ${arrowLeft},${height - arrowHeight}
        H ${BORDER_RADIUS}
        Q 0,${height - arrowHeight} 0,${height - arrowHeight - BORDER_RADIUS}
        V ${BORDER_RADIUS}
        Q 0,0 ${BORDER_RADIUS},0
      `;
    default:
      return '';
  }
};

export interface TooltipRef {
  dismiss: () => void;
  open: () => void;
}

interface FeatureHintTooltipProps {
  children: React.ReactNode;
  title?: string;
  TitleComponent?: React.ReactNode;
  subtitle?: string;
  SubtitleComponent?: React.ReactNode;
  side?: Side;
  sideOffset?: number;
  align?: Align;
  alignOffset?: number;
  backgroundColor?: string;
  onDismissed?: () => void;
}

// Currently only used for first time feature hints, but if needed can be better abstracted for general tooltips
// If need to show above / on top of navigation elements, will need to refactor to use AbsolutePortal
export const FeatureHintTooltip = forwardRef<TooltipRef, FeatureHintTooltipProps>(
  (
    {
      children,
      title,
      TitleComponent,
      subtitle,
      SubtitleComponent,
      side = 'top',
      sideOffset = 5,
      align = 'center',
      alignOffset = 0,
      backgroundColor = 'rgba(255, 255, 255, 0.95)',
      onDismissed,
    },
    ref
  ) => {
    const opacity = useSharedValue(0);
    const isVisible = useSharedValue(false);
    const childLayout = useSharedValue<Position | null>(null);
    const { width: deviceWidth } = useWindowDimensions();
    const hasOpened = useRef(false);
    const tooltipWidth = Math.min(deviceWidth * 0.9, TOOLTIP_MAX_WIDTH);

    const tooltipPath = useMemo(() => calculateTooltipPath(side, align, tooltipWidth), [side, align, tooltipWidth]);

    useImperativeHandle(ref, () => ({
      dismiss: () => {
        hideTooltip();
      },
      open: () => {
        showTooltip();
      },
    }));

    const showTooltip = useCallback(() => {
      'worklet';
      hasOpened.current = true;
      isVisible.value = true;
      opacity.value = withTiming(1, TIMING_CONFIGS.slowestFadeConfig);
    }, [isVisible, opacity]);

    const hideTooltip = useCallback(() => {
      'worklet';
      opacity.value = withTiming(0, TIMING_CONFIGS.slowFadeConfig, finished => {
        if (finished) {
          isVisible.value = false;
          if (onDismissed) {
            runOnJS(onDismissed)();
          }
        }
      });
    }, [isVisible, onDismissed, opacity]);

    const measureChildLayout = useCallback(
      (event: LayoutChangeEvent): void => {
        const { x, y, width, height } = event.nativeEvent.layout;
        childLayout.value = { x, y, width, height };
        // tooltip defaults to openning automatically, but only if it has not been opened yet so that re-renders don't open it again
        if (!hasOpened.current) {
          showTooltip();
        }
      },
      [childLayout, showTooltip, hasOpened]
    );

    const tooltipStyle = useAnimatedStyle(() => {
      // always returning same style object shape optimizes hook
      if (!childLayout.value || !isVisible.value) {
        return {
          opacity: 0,
          transform: [{ translateX: 0 }, { translateY: 0 }],
          pointerEvents: 'none',
        };
      }

      let translateY = 0;
      if (side === 'bottom') {
        translateY = childLayout.value.y + childLayout.value.height + sideOffset;
      } else if (side === 'top') {
        translateY = childLayout.value.y - TOOLTIP_HEIGHT - ARROW_SIZE - sideOffset;
      }

      let translateX = 0;
      switch (align) {
        case 'start':
          translateX = childLayout.value.x + alignOffset;
          break;
        case 'center':
          translateX = childLayout.value.x + (childLayout.value.width - tooltipWidth) / 2 + alignOffset;
          break;
        case 'end':
          translateX = childLayout.value.x + childLayout.value.width - tooltipWidth + alignOffset;
          break;
      }

      return {
        opacity: opacity.value,
        transform: [{ translateX }, { translateY }],
        pointerEvents: opacity.value === 0 ? 'none' : ('auto' as const),
      };
    });

    return (
      <>
        <View onLayout={measureChildLayout}>{children}</View>
        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.tooltipContainer, { width: tooltipWidth }, tooltipStyle]}>
            <MaskedView
              style={styles.maskedContainer}
              maskElement={
                <Svg
                  width={tooltipWidth}
                  height={TOOLTIP_HEIGHT + ARROW_SIZE}
                  viewBox={`0 0 ${tooltipWidth} ${TOOLTIP_HEIGHT + ARROW_SIZE}`}
                >
                  <Path d={tooltipPath} fill="black" />
                </Svg>
              }
            >
              <Box
                style={[
                  styles.background,
                  {
                    backgroundColor,
                  },
                ]}
              >
                <BlurView blurAmount={30} blurType="light" overlayColor="transparent" style={StyleSheet.absoluteFill} />
                <View
                  style={[
                    styles.contentContainer,
                    { marginTop: side === 'top' ? 0 : ARROW_SIZE, marginBottom: side === 'bottom' ? 0 : ARROW_SIZE },
                  ]}
                >
                  <LinearGradient colors={['#268FFF1F', '#268FFF14']} angle={135} useAngle style={styles.iconContainer}>
                    <Text weight="heavy" size="17pt" color={{ custom: '#268FFF' }}>
                      􀍱
                    </Text>
                  </LinearGradient>
                  <View style={styles.textContainer}>
                    {TitleComponent || (
                      <Text weight="heavy" size="15pt" color={{ custom: globalColors.grey80 }}>
                        {title}
                      </Text>
                    )}
                    {SubtitleComponent || (
                      <Text weight="semibold" size="13pt" color={{ custom: globalColors.grey60 }}>
                        {subtitle}
                      </Text>
                    )}
                  </View>
                  <View style={{ paddingVertical: 4 }}>
                    <ButtonPressAnimation onPress={hideTooltip}>
                      <HitSlop space="4px">
                        <Text size="13pt" weight="heavy" color={{ custom: globalColors.grey60 }}>
                          􀆄
                        </Text>
                      </HitSlop>
                    </ButtonPressAnimation>
                  </View>
                </View>
              </Box>
            </MaskedView>
          </Animated.View>
        </View>
      </>
    );
  }
);

FeatureHintTooltip.displayName = 'FeatureHintTooltip';

const styles = StyleSheet.create({
  tooltipContainer: {
    position: 'absolute',
    height: TOOLTIP_HEIGHT + ARROW_SIZE,
    zIndex: 99999999,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 50,
    elevation: 25,
  },
  maskedContainer: {
    flex: 1,
  },
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    padding: TOOLTIP_PADDING,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    height: ICON_SIZE,
    width: ICON_SIZE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#268FFF0D',
    backgroundColor: '#268FFF14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
});
