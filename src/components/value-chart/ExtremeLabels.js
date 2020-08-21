import React, { useEffect, useRef, useState } from 'react';
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

function useJustChanged(deps) {
  const timeout = useRef();
  const initial = useRef(true);
  const prevDeps = useRef(null);
  const [hasJustChanged, setHasJustChanges] = useState(false);

  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      prevDeps.current = deps;
      return;
    }
    if (prevDeps) {
      // ignore small changes e.g. while updating data
      for (let i = 0; i < deps.length; i++) {
        if (Math.abs(deps[i] - prevDeps.current?.[i]) < 0.01) {
          prevDeps.current = deps;
          return;
        }
      }
    }
    prevDeps.current = deps;
    setHasJustChanges(true);
    clearTimeout(timeout.current);
    setTimeout(() => {
      setHasJustChanges(false);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return hasJustChanged;
}

export default function Labels({ color, width }) {
  const { greatestX, greatestY, smallestX, smallestY } = useChartData();

  let positionMin, positionMax;
  if (greatestX) {
    positionMin = trim(
      (smallestY.x - smallestX.x) / (greatestX.x - smallestX.x)
    );
    positionMax = trim(
      (greatestY.x - smallestX.x) / (greatestX.x - smallestX.x)
    );
  }

  const justChanged = useJustChanged([positionMin, positionMax]);

  if (!greatestX) {
    return null;
  }

  return (
    <>
      {positionMin && !justChanged ? (
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
      {positionMax && !justChanged ? (
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
