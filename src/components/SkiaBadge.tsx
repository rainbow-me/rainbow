import { StyleSheet } from 'react-native';
import { Canvas, Group, Rect, RoundedRect, Shadow, SkParagraph, rect, rrect } from '@shopify/react-native-skia';
import { memo, useCallback } from 'react';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
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

export const SkiaBadge = memo(function SkiaBadge({
  text,
  height = 27,
  horizontalPadding = 8,
  fillColor,
  textColor,
  strokeColor,
  strokeWidth = 2,
  dropShadows = [],
  innerShadows = [],
  fontSize = '15pt',
  fontWeight = 'heavy',
}: SkiaBadgeProps) {
  const { colorMode } = useColorMode();
  const measuredTextWidth = useSharedValue(0);
  const measuredTextHeight = useSharedValue(0);
  const isReady = useSharedValue(false);

  const onTextLayout = useCallback(
    (paragraph: SkParagraph) => {
      'worklet';
      const metrics = paragraph.getLineMetrics();
      if (metrics.length > 0) {
        const { height: textHeight, width: textWidth } = metrics[0];
        measuredTextWidth.value = textWidth;
        measuredTextHeight.value = textHeight;
        isReady.value = true;
      }
    },
    [measuredTextWidth, measuredTextHeight, isReady]
  );

  // Calculate maximum shadow extent for canvas overflow
  const maxShadowExtent = Math.ceil(Math.max(...dropShadows.map(s => s.blur * 2 + Math.max(Math.abs(s.dx), Math.abs(s.dy))), 0));

  const badgeWidth = useDerivedValue(() => {
    return measuredTextWidth.value + horizontalPadding * 2;
  }, [measuredTextWidth, horizontalPadding]);

  const textX = useDerivedValue(() => {
    return maxShadowExtent + (badgeWidth.value - measuredTextWidth.value) / 2;
  }, [measuredTextWidth, badgeWidth, maxShadowExtent]);

  const textY = useDerivedValue(() => {
    return maxShadowExtent + (height - measuredTextHeight.value) / 2;
  }, [measuredTextHeight, height, maxShadowExtent]);

  const badgeRect = useDerivedValue(() => {
    return rrect(rect(maxShadowExtent, maxShadowExtent, badgeWidth.value, height), height / 2, height / 2);
  }, [badgeWidth, height, maxShadowExtent]);

  const innerStrokeRect = useDerivedValue(() => {
    return rrect(
      rect(maxShadowExtent + strokeWidth, maxShadowExtent + strokeWidth, badgeWidth.value - strokeWidth * 2, height - strokeWidth * 2),
      (height - strokeWidth * 2) / 2,
      (height - strokeWidth * 2) / 2
    );
  }, [badgeWidth, height, strokeWidth, maxShadowExtent]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      width: badgeWidth.value + maxShadowExtent * 2,
      height: height + maxShadowExtent * 2,
      marginHorizontal: -maxShadowExtent,
      marginVertical: -maxShadowExtent,
      opacity: isReady.value ? 1 : 0,
    };
  }, [badgeWidth, height, isReady, maxShadowExtent]);

  const fillColors = Array.isArray(fillColor) ? fillColor : [fillColor];
  const strokeColors = strokeColor ? (Array.isArray(strokeColor) ? strokeColor : [strokeColor]) : [];

  return (
    <Animated.View style={containerStyle}>
      <Canvas style={styles.canvas}>
        <Group>
          {/* Drop Shadows */}
          {dropShadows.map((shadow, index) => (
            <RoundedRect key={`drop-${index}`} rect={badgeRect}>
              <Shadow dx={shadow.dx} dy={shadow.dy} blur={shadow.blur} color={shadow.color} shadowOnly />
            </RoundedRect>
          ))}

          {/* Fill */}
          {fillColors.map((color, index) => (
            <RoundedRect key={`fill-${index}`} rect={badgeRect} color={color} antiAlias dither />
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
          {innerShadows.map((shadow, index) => (
            <RoundedRect key={`inner-${index}`} rect={badgeRect}>
              <Shadow dx={shadow.dx} dy={shadow.dy} blur={shadow.blur} color={shadow.color} inner shadowOnly />
            </RoundedRect>
          ))}

          <SkiaText
            size={fontSize}
            colorMode={colorMode}
            weight={fontWeight}
            width={badgeWidth}
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
    width: '100%',
    height: '100%',
  },
});
