import { maxBy, minBy } from 'lodash';

export default function simplifyChartData(data: any, destinatedNumberOfPoints: number) {
  if (!data) return null;

  let allSegmentDividers: any = [];
  let allSegmentsPoints: any = [];
  let colors = [];
  let lines = [];
  let dividers = [];
  let lastPoints = [];
  let createdLastPoints: any = [];

  if (data.segments.length > 0) {
    for (let i = 0; i < 1; i++) {
      allSegmentsPoints = allSegmentsPoints.concat(data.segments[i].points);
      allSegmentsPoints[allSegmentsPoints.length - 1] = {
        ...allSegmentsPoints[allSegmentsPoints.length - 1],
        lastPoint: true,
      };
      lastPoints.push(allSegmentsPoints.length - 1);
      colors.push(data.segments[i].color);
      lines.push(data.segments[i].line);
      dividers.push(data.segments[i].renderStartSeparator);
    }
  }
  if (allSegmentsPoints.length > destinatedNumberOfPoints) {
    let destMul = allSegmentsPoints.length / destinatedNumberOfPoints;
    const maxValue = maxBy(allSegmentsPoints, 'y');
    const minValue = minBy(allSegmentsPoints, 'y');

    const dataDiff = allSegmentsPoints[allSegmentsPoints.length - 1].x - allSegmentsPoints[0].x;
    const xMul = Math.floor(dataDiff / allSegmentsPoints.length);
    let newData = [];
    newData.push({
      isImportant: true,
      x: allSegmentsPoints[0].x - xMul * 2,
      y: allSegmentsPoints[0].y,
    });
    for (let i = 1; i < destinatedNumberOfPoints - 1; i++) {
      const indexPlace = i * destMul;
      const r = indexPlace % 1;
      const f = Math.floor(indexPlace);

      const firstValue = allSegmentsPoints[f].y * r;
      const secondValue = allSegmentsPoints[f + 1].y * (1 - r);

      let finalValue;
      // @ts-expect-error ts-migrate(2367) FIXME: This condition will always return 'false' since th... Remove this comment to see the full error message
      if (firstValue === maxValue) {
        finalValue = maxValue;
        // @ts-expect-error ts-migrate(2367) FIXME: This condition will always return 'false' since th... Remove this comment to see the full error message
      } else if (secondValue === minValue) {
        finalValue = minValue;
      } else {
        finalValue = firstValue + secondValue;
      }
      if (indexPlace > lastPoints[createdLastPoints.length]) {
        createdLastPoints.push(newData.length);
      }
      newData.push({
        isImportant: (allSegmentsPoints[f].isImportant || allSegmentsPoints[f + 1].isImportant) && !newData[newData.length - 1].isImportant,
        x: allSegmentsPoints[0].x + i * xMul,
        y: finalValue,
      });
    }
    newData.push({
      isImportant: true,
      x: allSegmentsPoints[0].x + destinatedNumberOfPoints * xMul + xMul * 2,
      y: allSegmentsPoints[allSegmentsPoints.length - 1].y,
    });

    return {
      allPointsForData: allSegmentsPoints,
      allSegmentDividers: allSegmentDividers.concat(createdLastPoints),
      colors,
      lastPoints: createdLastPoints,
      lines,
      points: newData,
      startSeparatator: dividers,
    };
  } else if (allSegmentsPoints.length > 1) {
    return {
      allPointsForData: allSegmentsPoints,
      allSegmentDividers,
      colors,
      lastPoints: createdLastPoints,
      lines,
      points: allSegmentsPoints,
      startSeparatator: dividers,
    };
  }
}
