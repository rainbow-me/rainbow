import { AnimatedProp, Paragraph, SkParagraph, Transforms3d } from '@shopify/react-native-skia';
import React, { ReactNode, useCallback, useContext, useMemo } from 'react';
import { DerivedValue, isSharedValue, useDerivedValue } from 'react-native-reanimated';
import { TextAlign } from '@/components/text/types';
import { AccentColorContext } from '@/design-system/color/AccentColorContext';
import {
  BackgroundColorValue,
  ColorMode,
  TextColor,
  foregroundColors,
  getDefaultAccentColorForColorMode,
} from '@/design-system/color/palettes';
import { CustomColor } from '@/design-system/color/useForegroundColor';
import { useSkiaText } from '@/design-system/components/SkiaText/useSkiaText';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize } from '@/design-system/typography/typeHierarchy';
import { IS_IOS } from '@/env';
import { SharedOrDerivedValueText } from '../Text/AnimatedText';

export interface SkiaTextChildProps {
  children: string;
  color?: TextColor | CustomColor;
  opacity?: number;
  weight?: TextWeight;
}

export const SkiaTextChild: React.FC<SkiaTextChildProps> = () => null;

export interface SkiaTextProps {
  align?: TextAlign;
  children: ReactNode | SharedOrDerivedValueText | string;
  color?: TextColor | CustomColor;
  colorMode?: ColorMode;
  letterSpacing?: number;
  lineHeight?: number;
  onLayout?: (paragraph: SkParagraph) => void;
  size: TextSize;
  transform?: AnimatedProp<Transforms3d | undefined>;
  weight?: TextWeight;
  width: AnimatedProp<number>;
  x: AnimatedProp<number>;
  y: AnimatedProp<number>;
}

export interface SkiaTextHandle {
  get: () => DerivedValue<SkParagraph | null>;
}

function isSharedOrDerivedValueText(children: ReactNode | SharedOrDerivedValueText | string): children is SharedOrDerivedValueText {
  return isSharedValue<string>(children);
}

export const SkiaText = ({
  align = 'left',
  children,
  color: providedColor = 'label',
  colorMode = 'dark',
  letterSpacing,
  lineHeight,
  onLayout,
  size,
  transform,
  weight = 'bold',
  width,
  x,
  y,
}: SkiaTextProps) => {
  const accentColor = useContext(AccentColorContext);
  const color = getTextColor(providedColor, colorMode, accentColor);

  const getSegmentColor = useCallback(
    (textColor: TextColor | CustomColor | undefined) => {
      'worklet';
      if (!textColor) return color;
      return getTextColor(textColor, colorMode, accentColor);
    },
    [accentColor, color, colorMode]
  );

  const buildParagraph = useSkiaText(
    useMemo(
      () => ({
        align,
        color,
        colorMode,
        letterSpacing,
        lineHeight,
        size,
        weight,
      }),
      [align, color, colorMode, letterSpacing, lineHeight, size, weight]
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
          const { children: text, color: segColor, weight: segWeight, opacity: segOpacity }: SkiaTextChildProps = child.props;
          return {
            color: getSegmentColor(segColor),
            opacity: segOpacity,
            text,
            weight: segWeight,
          };
        }
        // Handle plain strings between segments
        return { text: String(child), color, weight };
      });
    }

    // Simple text case - just one segment with the entire text
    return [
      {
        color,
        text: isSharedValue ? children : childOrChildrenArray.map(child => String(child)).join(''),
        weight,
      },
    ];
  }, [children, color, getSegmentColor, weight]);

  const segmentsDep = IS_IOS ? segments : undefined;

  const paragraph = useDerivedValue(() => {
    if (!buildParagraph) return null;
    const paragraph = buildParagraph(segments);
    if (onLayout && paragraph) {
      paragraph.layout(typeof width === 'number' ? width : width.value);
      onLayout(paragraph);
    }
    return paragraph;
  }, [buildParagraph, segmentsDep]);

  return <Paragraph paragraph={paragraph} transform={transform} width={width} x={x} y={y} />;
};

function getTextColor(color: TextColor | CustomColor | 'accent', colorMode: ColorMode, accentColor: BackgroundColorValue | null): string {
  'worklet';
  const binaryColorMode = colorMode === 'dark' || colorMode === 'darkTinted' ? 'dark' : 'light';
  switch (color) {
    case 'accent':
      return accentColor?.color ?? getDefaultAccentColorForColorMode(binaryColorMode).color;
    default:
      if (typeof color === 'object' && 'custom' in color) {
        return typeof color.custom === 'string' ? color.custom : color.custom[binaryColorMode];
      }
      return foregroundColors[color][binaryColorMode];
  }
}
