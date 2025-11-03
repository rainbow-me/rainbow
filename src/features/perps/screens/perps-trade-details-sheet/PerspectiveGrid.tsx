import React, { useMemo } from 'react';
import { Path, Skia, Group, PaintStyle } from '@shopify/react-native-skia';

type PerspectiveGridProps = {
  width: number;
  height: number;
  vanishingPointY?: number;
  lineColor?: string;
  lineWidth?: number;
  horizontalLines?: number;
  verticalLines?: number;
  perspectiveStrength?: number;
};

export const PerspectiveGrid = ({
  width,
  height,
  vanishingPointY = -200,
  lineColor = '#00d4ff',
  lineWidth = 4 / 3,
  horizontalLines = 6,
  verticalLines = 12,
  perspectiveStrength = 1.5,
}: PerspectiveGridProps) => {
  const vanishingPointX = width / 2;

  const paint = useMemo(() => {
    const p = Skia.Paint();
    p.setColor(Skia.Color(lineColor));
    p.setStrokeWidth(lineWidth);
    p.setStyle(PaintStyle.Stroke);
    p.setAntiAlias(true);
    return p;
  }, [lineWidth, lineColor]);

  const horizontalLinesPath = useMemo(() => {
    const path = Skia.Path.Make();

    for (let i = 0; i < horizontalLines; i++) {
      const t = i / (horizontalLines - 1); // 0 to 1 from bottom to top

      // Invert the perspective so tiles are bigger at the bottom (near)
      // and smaller at the top (far)
      const perspectiveFactor = 1 - Math.pow(1 - t, perspectiveStrength);

      // Map to height (bottom to top)
      const y = height * (1 - perspectiveFactor);

      path.moveTo(0, y);
      path.lineTo(width, y);
    }

    return path;
  }, [horizontalLines, height, width, perspectiveStrength]);

  const verticalLinesPath = useMemo(() => {
    const path = Skia.Path.Make();

    for (let i = 0; i < verticalLines; i++) {
      // Calculate X position at the bottom of the grid
      const xBottom = (width / (verticalLines - 1)) * i;
      const yBottom = height;

      // Calculate intersection with top boundary (y=0)
      const t = (0 - yBottom) / (vanishingPointY - yBottom);
      const xTop = xBottom + (vanishingPointX - xBottom) * t;
      const yTop = 0;

      path.moveTo(xBottom, yBottom);
      path.lineTo(xTop, yTop);
    }

    return path;
  }, [verticalLines, width, height, vanishingPointX, vanishingPointY]);

  return (
    <Group>
      <Path path={horizontalLinesPath} paint={paint} />
      <Path path={verticalLinesPath} paint={paint} />
    </Group>
  );
};
