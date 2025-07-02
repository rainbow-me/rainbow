import { AnimatedProp, Paragraph, SkPaint, SkParagraph, SkTextShadow, Transforms3d } from '@shopify/react-native-skia';
import React, { ComponentType, ReactNode, useCallback, useContext, useMemo } from 'react';
import { isSharedValue, runOnUI, useDerivedValue } from 'react-native-reanimated';
import { TextAlign } from '@/components/text/types';
import { AccentColorContext } from '@/design-system/color/AccentColorContext';
import { ColorMode, TextColor } from '@/design-system/color/palettes';
import { CustomColor, getColorForTheme } from '@/design-system/color/useForegroundColor';
import { useSkiaText } from '@/design-system/components/SkiaText/useSkiaText';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { SharedOrDerivedValueText } from '../Text/AnimatedText';

export type SkiaTextProps = {
  align?: TextAlign;
  /**
   * Useful for applying fills or effects to the text's background. Simply define a
   * SkPaint object and pass it to the `SkiaText` component.
   * @example
   * ```tsx
   * // At module scope (or otherwise made stable)
   * const backgroundPaint = Skia.Paint();
   * backgroundPaint.setShader(
   *   source.makeShader([0, 0, 256, 256, ...colors])
   * );
   * ```
   * @docs https://shopify.github.io/react-native-skia/docs/text/paragraph#using-paints
   */
  backgroundPaint?: SkPaint;
  children: ReactNode | SharedOrDerivedValueText | string;
  color?: TextColor | CustomColor;
  colorMode?: ColorMode;
  /**
   * Useful for applying fills or effects to the text itself. Simply define
   * a SkPaint object and pass it to the `SkiaText` component.
   * @example
   * ```tsx
   * // At module scope (or otherwise made stable)
   * const foregroundPaint = Skia.Paint();
   * foregroundPaint.setMaskFilter(
   *   Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 10, false)
   * );
   * ```
   * @docs https://shopify.github.io/react-native-skia/docs/text/paragraph#using-paints
   */
  foregroundPaint?: SkPaint;
  letterSpacing?: number;
  lineHeight?: number;
  /**
   * Receives the raw `paragraph` object, which contains methods that can
   * be used to obtain detailed text metrics.
   */
  onLayoutWorklet?: (paragraph: SkParagraph) => void;
  shadows?: SkTextShadow[];
  size: TextSize;
  transform?: AnimatedProp<Transforms3d | undefined>;
  weight?: TextWeight;
  width: AnimatedProp<number>;
  x: AnimatedProp<number>;
  y: AnimatedProp<number>;
};

export type SkiaTextChildProps = {
  backgroundPaint?: SkiaTextProps['backgroundPaint'];
  children: string;
  color?: SkiaTextProps['color'];
  foregroundPaint?: SkiaTextProps['foregroundPaint'];
  opacity?: number;
  shadows?: SkTextShadow[];
  weight?: SkiaTextProps['weight'];
};

export const SkiaTextChild: ComponentType<SkiaTextChildProps> = () => null;

export const SkiaText = ({
  align = 'left',
  backgroundPaint,
  children,
  color: providedColor = 'label',
  colorMode = 'dark',
  foregroundPaint,
  letterSpacing,
  lineHeight,
  onLayoutWorklet,
  shadows,
  size,
  transform,
  weight = 'bold',
  width,
  x,
  y,
}: SkiaTextProps) => {
  const accentColor = useContext(AccentColorContext);
  const color = getColorForTheme(providedColor, colorMode, accentColor);

  const getSegmentColor = useCallback(
    (textColor: TextColor | CustomColor | undefined) => {
      'worklet';
      if (!textColor) return color;
      return getColorForTheme(textColor, colorMode, accentColor);
    },
    [accentColor, color, colorMode]
  );

  const buildParagraph = useSkiaText(
    useMemo(
      () => ({
        align,
        backgroundPaint,
        color,
        foregroundPaint,
        letterSpacing,
        lineHeight,
        shadows,
        size,
        weight,
      }),
      [align, backgroundPaint, color, foregroundPaint, letterSpacing, lineHeight, shadows, size, weight]
    )
  );

  const segments = useMemo(() => {
    const isSharedValue = isSharedOrDerivedValueText(children);
    const childOrChildrenArray = isSharedValue ? [children] : React.Children.toArray(children);

    // Check if any SkiaTextChild components are present
    const hasSegments = !isSharedValue && childOrChildrenArray.some(child => React.isValidElement(child) && child.type === SkiaTextChild);

    if (hasSegments) {
      return childOrChildrenArray.map(child => {
        if (React.isValidElement(child) && child.type === SkiaTextChild) {
          const {
            children: text,
            color: segColor,
            shadows: segShadows,
            weight: segWeight,
            opacity: segOpacity,
          } = child.props as SkiaTextChildProps;
          return {
            color: getSegmentColor(segColor),
            opacity: segOpacity,
            shadows: segShadows,
            text,
            weight: segWeight,
          };
        }
        // Handle plain strings between segments
        return { text: String(child), color, weight };
      });
    }

    // Simple text case - just one segment with the entire text
    return {
      color,
      text: isSharedValue ? children : childOrChildrenArray.map(child => String(child)).join(''),
      weight,
    };
  }, [children, color, getSegmentColor, weight]);

  const paragraph = useDerivedValue(() => {
    if (!buildParagraph) return null;
    const paragraph = buildParagraph(segments);

    if (onLayoutWorklet && paragraph) {
      if (_WORKLET) {
        paragraph.layout(typeof width === 'number' ? width : width.value);
        onLayoutWorklet(paragraph);
      } else {
        runOnUI(() => {
          paragraph.layout(typeof width === 'number' ? width : width.value);
          onLayoutWorklet(paragraph);
        })();
      }
    }
    return paragraph;
  }, [buildParagraph, onLayoutWorklet, segments, width]);

  return <Paragraph paragraph={paragraph} transform={transform} width={width} x={x} y={y} />;
};

function isSharedOrDerivedValueText(children: ReactNode | SharedOrDerivedValueText | string): children is SharedOrDerivedValueText {
  return isSharedValue<string>(children);
}
