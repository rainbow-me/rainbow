import { StyleSheet } from 'react-native';
import { Canvas, Group, Rect, RoundedRect, Shadow, SkParagraph, rect, rrect } from '@shopify/react-native-skia';
import { memo, useCallback, useMemo } from 'react';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { SkiaText, useColorMode } from '@/design-system';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextColor } from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';

type Shadow = {
  dx: number;
  dy: number;
  blur: number;
  color: string;
};

type SkiaBadgeProps = {
  text: string;
  height?: number;
  horizontalPadding?: number;
  fillColor: string | string[];
  textColor: TextColor | CustomColor;
  strokeColor?: string | string[];
  strokeWidth?: number;
  dropShadows?: Shadow[];
  innerShadows?: Shadow[];
  fontSize?: TextSize;
  fontWeight?: TextWeight;
  lineHeight?: number;
};

const ZERO_RECT = rrect(rect(0, 0, 0, 0), 0, 0);

export const SkiaBadge = memo(function SkiaBadge({
  text,
  height = 27,
  horizontalPadding = 8,
  fillColor,
  textColor,
  strokeColor,
  strokeWidth = 2,
  dropShadows,
  innerShadows,
  fontSize = '15pt',
  fontWeight = 'heavy',
}: SkiaBadgeProps) {
  const { colorMode } = useColorMode();
  const measuredTextWidth = useSharedValue(0);
  const measuredTextHeight = useSharedValue(0);
  const badgeWidth = useSharedValue(0);
  const isReady = useSharedValue(false);
  const textX = useSharedValue(0);
  const textY = useSharedValue(0);
  const badgeRect = useSharedValue(ZERO_RECT);
  const innerStrokeRect = useSharedValue(ZERO_RECT);

  // Calculate maximum shadow extent for canvas overflow
  const maxShadowExtent = useMemo(() => {
    return Math.ceil(Math.max(...(dropShadows?.map(s => s.blur * 2 + Math.max(Math.abs(s.dx), Math.abs(s.dy))) ?? []), 0));
  }, [dropShadows]);

  const onTextLayout = useCallback(
    (paragraph: SkParagraph) => {
      'worklet';
      const metrics = paragraph.getLineMetrics();
      if (metrics.length > 0) {
        const { height: textHeight, width: textWidth } = metrics[0];
        measuredTextWidth.value = textWidth;
        measuredTextHeight.value = textHeight;
        const rectWidth = measuredTextWidth.value + horizontalPadding * 2;
        badgeWidth.value = rectWidth;
        textX.value = maxShadowExtent + (rectWidth - textWidth) / 2;
        textY.value = maxShadowExtent + (height - textHeight) / 2;
        badgeRect.value = rrect(rect(maxShadowExtent, maxShadowExtent, rectWidth, height), height / 2, height / 2);
        innerStrokeRect.value = rrect(
          rect(maxShadowExtent + strokeWidth, maxShadowExtent + strokeWidth, rectWidth - strokeWidth * 2, height - strokeWidth * 2),
          (height - strokeWidth * 2) / 2,
          (height - strokeWidth * 2) / 2
        );
        isReady.value = true;
      }
    },
    [
      measuredTextWidth,
      measuredTextHeight,
      badgeWidth,
      horizontalPadding,
      textX,
      maxShadowExtent,
      textY,
      height,
      badgeRect,
      innerStrokeRect,
      strokeWidth,
      isReady,
    ]
  );

  const containerStyle = useAnimatedStyle(() => {
    const paddedWidth = badgeWidth.value + maxShadowExtent * 2;
    const paddedHeight = height + maxShadowExtent * 2;
    /**
     * Math.ceil and `StyleSheet.hairlineWidth` are a hack to ensure the Canvas is not clipped.
     * There is a layout bug that causes clipping that only occurs when two SkiaBadge components are laid out in a row with a gap.
     * It does not occur every time, and is not solved by Math.ceil alone.
     */
    const roundedCanvasWidth = Math.ceil(paddedWidth) + StyleSheet.hairlineWidth;
    const roundedCanvasHeight = paddedHeight;
    return {
      width: roundedCanvasWidth,
      height: roundedCanvasHeight,
      marginHorizontal: -maxShadowExtent,
      marginVertical: -maxShadowExtent,
      opacity: isReady.value ? 1 : 0,
    };
  }, [badgeWidth, height, maxShadowExtent]);

  const fillColors = Array.isArray(fillColor) ? fillColor : [fillColor];
  const strokeColors = strokeColor ? (Array.isArray(strokeColor) ? strokeColor : [strokeColor]) : [];

  return (
    <Animated.View style={containerStyle}>
      <Canvas style={styles.canvas}>
        <Group antiAlias dither>
          {/* Drop Shadows */}
          {dropShadows?.map((shadow, index) => (
            <RoundedRect key={`drop-${index}`} rect={badgeRect}>
              <Shadow dx={shadow.dx} dy={shadow.dy} blur={shadow.blur} color={shadow.color} shadowOnly />
            </RoundedRect>
          ))}

          {/* Fill */}
          {fillColors.map((color, index) => (
            <RoundedRect key={`fill-${index}`} rect={badgeRect} color={color} />
          ))}

          {/* Inner stroke */}
          {strokeColors.map((color, index) => (
            <Group key={`stroke-${index}`} clip={badgeRect}>
              <Rect
                clip={innerStrokeRect}
                invertClip={true}
                x={maxShadowExtent}
                y={maxShadowExtent}
                width={badgeWidth}
                height={height}
                color={color}
              />
            </Group>
          ))}

          {/* Inner Shadows */}
          {innerShadows?.map((shadow, index) => (
            <RoundedRect key={`inner-${index}`} rect={badgeRect}>
              <Shadow dx={shadow.dx} dy={shadow.dy} blur={shadow.blur} color={shadow.color} inner shadowOnly />
            </RoundedRect>
          ))}

          <SkiaText
            size={fontSize}
            colorMode={colorMode}
            weight={fontWeight}
            // Arbitrary width so that the text is not wrapped.
            width={1000}
            x={textX}
            y={textY}
            color={textColor}
            onLayoutWorklet={onTextLayout}
            halfLeading
          >
            {text}
          </SkiaText>
        </Group>
      </Canvas>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
  },
});
