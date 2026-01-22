import { getSvgPath } from 'figma-squircle';
import { IS_IOS } from '@/env';

/**
 * Creates a squircle (superellipse) path - a smooth blend between a square and circle.
 * This produces the characteristic iOS-style rounded corners seen in app icons and modern UI.
 *
 * On iOS, applies corner smoothing (0.6 by default) for platform-native appearance.
 * On Android, defaults to regular rounded rectangles (smoothing = 0) to match Material Design.
 *
 * @param borderRadius - The radius of the corners
 * @param cornerSmoothing - How smooth the corners should be (0 = rounded rect, 1 = circle-like). Defaults to 0.6 on iOS, 0 on Android
 * @param height - The height of the shape
 * @param width - The width of the shape
 * @returns An SVG path representing the squircle
 */
export function getSquirclePath({
  borderRadius,
  cornerSmoothing = IS_IOS ? 0.6 : 0,
  height,
  width,
}: {
  borderRadius: number;
  cornerSmoothing?: number;
  height: number;
  width: number;
}): string {
  return getSvgPath({
    cornerRadius: borderRadius,
    cornerSmoothing,
    height,
    width,
  });
}
