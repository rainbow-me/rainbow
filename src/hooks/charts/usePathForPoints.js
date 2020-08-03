import * as shape from 'd3-shape';
import { maxBy, minBy } from 'lodash';
import { useMemo } from 'react';
import useDimensions from '../useDimensions';

const additionalChartPadding = 999999;

export default function usePathForPoints({
  canvasHeight,
  latestPrice,
  points,
}) {
  const { width } = useDimensions();
  return useMemo(() => {
    if (!points) return null;
    let path = points;
    path[path.length - 1].y = latestPrice;

    const minX = path[0].x;
    const maxX = path[path.length - 1].x;
    const minY = minBy(path, 'y').y;
    const maxY = maxBy(path, 'y').y;

    const buildLine = shape
      .line()
      .curve(shape.curveBasis)
      .x(d => (d.x - minX) / ((maxX - minX) / width))
      .y(d => (d.y - minY) / ((maxY - minY) / canvasHeight));

    return buildLine([
      {
        x: path[0].x - additionalChartPadding,
        y: path[0].y,
      },
      ...path,
      {
        x: path[path.length - 1].x + additionalChartPadding,
        y: path[path.length - 1].y,
      },
    ]);
  }, [canvasHeight, latestPrice, points, width]);
}
