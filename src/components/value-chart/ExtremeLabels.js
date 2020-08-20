import React from 'react';
import styled from 'styled-components/primitives';
import { colors, fonts } from '../../styles';
import { formatUSD } from '../expanded-state/chart/chart-data-labels/ChartPriceLabel';
import { Text } from '../text';
import { useChartData } from 'react-native-animated-charts';

function trim(val) {
  return Math.min(Math.max(val, 0.05), 0.95);
}

const Label = styled(Text)`
  font-size: ${fonts.size.smedium};
  font-weight: ${fonts.weight.bold};
  letter-spacing: ${fonts.letterSpacing.roundedTighter};
  position: absolute;
`;

export default function Labels({ color, width }) {
  const { greatestX, greatestY, smallestX, smallestY } = useChartData();
  if (!greatestX) {
    return null;
  }
  const positionMin = trim(
    (smallestY.x - smallestX.x) / (greatestX.x - smallestX.x)
  );
  const positionMax = trim(
    (greatestY.x - smallestX.x) / (greatestX.x - smallestX.x)
  );
  return (
    <>
      {positionMin ? (
        <Label
          color={colors.alpha(color, 0.8)}
          style={{
            bottom: -20,
            [positionMin > 0.5 ? 'right' : 'left']:
              (0.5 - Math.abs(0.5 - positionMin)) * width - 10,
          }}
        >
          {formatUSD(smallestY.y)}
        </Label>
      ) : null}
      {positionMax ? (
        <Label
          color={colors.alpha(color, 0.8)}
          style={{
            [positionMax > 0.5 ? 'right' : 'left']:
              (0.5 - Math.abs(0.5 - positionMax)) * width - 10,
            top: -20,
          }}
        >
          {formatUSD(greatestY.y)}
        </Label>
      ) : null}
    </>
  );
}
