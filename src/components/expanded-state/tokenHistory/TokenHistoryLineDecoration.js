import React, { useEffect, useMemo, useState, useCallback } from 'react';
import RadialGradient from 'react-native-radial-gradient';
import { Column, ColumnWithMargins, Row } from '../../layout';
import { Text } from '../../text';
import { FlatList, View, ScrollView, InteractionManager } from "react-native";
import styled from 'styled-components';
import { getHumanReadableDateWithoutOn } from '@rainbow-me/helpers/transactions';
import { useTheme } from '@rainbow-me/context';
import { useDimensions, useAccountProfile } from '@rainbow-me/hooks';
import { borders, colors } from '@rainbow-me/styles';

import logger from 'logger';

const TimelineLine = styled(View)`
  background-color: ${({ color }) => colors.alpha(color, 0.1)};
  border-radius: 1.5;
  height: 3;
`;

const TimelineDot = styled(RadialGradient).attrs(
  ({ color, theme: { colors } }) => ({
    center: [0, 0],
    colors:  [colors.whiteLabel, color]
  })
)`
  overflow: hidden;
  ${borders.buildCircle(10)};
`;

export default TokenHistoryLineDecoration({ color, isFirst }) {
  return (
          <RowWithMargins align="center" margin={6}>
            <TimelineDot color={color} flex={0} />
            {!isFirst && <TimelineLine color={color} flex={1}/>}
          </RowWithMargins>
  );
}
