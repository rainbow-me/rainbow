import { SkPaint, SkParagraph, SkTextShadow, SkTextStyle, Skia } from '@shopify/react-native-skia';
import { useCallback } from 'react';
import { TextAlign } from '@/components/text/types';
import { SharedOrDerivedValueText } from '@/design-system/components/Text/AnimatedText';
import { TextWeight } from '@/design-system/components/Text/Text';
import { TextSize, typeHierarchy } from '@/design-system/typography/typeHierarchy';
import { IS_IOS } from '@/env';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { getSkiaFontWeight, useSkiaFontManager } from './skiaFontManager';

interface TextSegment {
  backgroundPaint?: SkPaint;
  color?: string;
  foregroundPaint?: SkPaint;
  opacity?: number;
  shadows?: SkTextShadow[];
  text: SharedOrDerivedValueText | string;
  weight?: TextWeight;
}

interface UseSkiaTextOptions {
  align: TextAlign | undefined;
  backgroundPaint: SkPaint | undefined;
  color: string;
  foregroundPaint: SkPaint | undefined;
  letterSpacing: number | undefined;
  lineHeight: number | undefined;
  shadows: SkTextShadow[] | undefined;
  size: TextSize;
  weight: TextWeight | undefined;
}

/**
 * Internal hook that returns a worklet function for building Skia text paragraphs.
 * Powers the `SkiaText` component — generally not meant for direct use.
 * @returns A function that takes an array of text segments and returns a Skia paragraph
 */
export function useSkiaText({
  align = 'left',
  backgroundPaint,
  color,
  foregroundPaint,
  letterSpacing,
  lineHeight,
  shadows,
  size,
  weight = 'regular',
}: UseSkiaTextOptions): (segments: TextSegment[]) => SkParagraph | null {
  const manager = useSkiaFontManager(align, weight);

  // On Android, weight changes trigger the creation of a new paragraphBuilder, and we want to wait
  // until the new paragraphBuilder is created before rebuilding the paragraph. So to avoid a flash
  // of the incorrect weight if the new weight isn't yet loaded, we omit the dependency on weight.
  const weightDep = IS_IOS ? weight : undefined;

  const buildParagraph = useCallback(
    (segments: TextSegment[]) => {
      'worklet';
      const paragraphBuilder = manager.paragraphBuilder;
      if (!paragraphBuilder) return null;

      const fontInfo = typeHierarchy.text[size];
      paragraphBuilder.reset();

      if (foregroundPaint) foregroundPaint.setColor(Skia.Color(color));

      segments.forEach(segment => {
        const segmentStyle = getTextStyle({
          color,
          colorOverride: segment.color,
          fontInfo,
          letterSpacing,
          lineHeight,
          weight,
          weightOverride: segment.weight,
        });

        if (segment.foregroundPaint) segment.foregroundPaint.setColor(segmentStyle.color);
        if (shadows || segment.shadows) segmentStyle.shadows = segment.shadows;
        if (segment.opacity !== undefined && segment.color) {
          segmentStyle.color = Skia.Color(opacityWorklet(segment.color, segment.opacity));
        }
        paragraphBuilder.pushStyle(segmentStyle, segment.foregroundPaint ?? foregroundPaint, segment.backgroundPaint ?? backgroundPaint);
        paragraphBuilder.addText(typeof segment.text === 'string' ? segment.text : segment.text.value ?? '');
        paragraphBuilder.pop();
      });

      return paragraphBuilder.build();
    },
    // Only the weight dependency is omitted on Android (see comment above)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [backgroundPaint, color, foregroundPaint, letterSpacing, lineHeight, manager.paragraphBuilder, shadows, size, weightDep]
  );

  return buildParagraph;
}

/**
 * Builds the text style, merging in text segment overrides if needed.
 * @returns A SkTextStyle object
 */
function getTextStyle({
  color,
  colorOverride,
  fontInfo,
  letterSpacing,
  lineHeight,
  weight,
  weightOverride,
}: {
  color: string;
  colorOverride?: string;
  fontInfo: (typeof typeHierarchy.text)[TextSize];
  letterSpacing: number | undefined;
  lineHeight: number | undefined;
  weight: TextWeight;
  weightOverride?: TextWeight;
}): Required<Pick<SkTextStyle, 'color' | 'fontFamilies' | 'fontSize' | 'fontStyle' | 'heightMultiplier' | 'letterSpacing'>> & {
  shadows?: SkTextShadow[];
} {
  'worklet';
  return {
    color: Skia.Color(colorOverride ?? color),
    fontFamilies: IS_IOS ? ['SF Pro Rounded'] : [`SFProRounded-${weightOverride ?? weight}`],
    fontSize: fontInfo.fontSize,
    fontStyle: IS_IOS ? { weight: getSkiaFontWeight(weightOverride ?? weight) } : {},
    heightMultiplier: (lineHeight ? lineHeight : fontInfo.lineHeight) / fontInfo.fontSize,
    letterSpacing: letterSpacing ?? fontInfo.letterSpacing,
  };
}
