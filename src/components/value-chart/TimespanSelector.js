import React, { useCallback } from 'react';
import styled from 'styled-components/primitives';
import ChartTypes from '../../helpers/chartTypes';
import { colors, padding } from '../../styles';
import { JellySelector } from '../jelly-selector';
import { Centered, Row } from '../layout';
import { Text } from '../text';

const Container = styled(Centered)`
  padding-top: 30;
  width: 100%;
`;

const TimespanItemLabel = styled(Text).attrs(({ color, isSelected }) => ({
  align: 'center',
  color: isSelected ? color : colors.grey,
  letterSpacing: 'roundedTightest',
  size: 'smedium',
  weight: 'semibold',
}))`
  ${padding(0, 8)};
`;

const TimespanItem = ({ color, isSelected, item, ...props }) => (
  <Centered flexShrink={0} height={32} {...props}>
    <TimespanItemLabel color={color} isSelected={isSelected}>
      {ChartTypes[item] === ChartTypes.max
        ? 'MAX'
        : `1${item.charAt(0).toUpperCase()}`}
    </TimespanItemLabel>
  </Centered>
);

const TimespanItemRow = styled(Row).attrs({
  justify: 'space-between',
})`
  ${padding(0, 15)};
`;

const TimespanSelector = ({
  color = colors.dark,
  defaultIndex = 0,
  reloadChart,
}) => {
  const handleSelect = useCallback(
    newTimespan => reloadChart(ChartTypes[newTimespan]),
    [reloadChart]
  );

  return (
    <Container>
      <JellySelector
        backgroundColor={colors.alpha(color, 0.06)}
        color={color}
        defaultIndex={defaultIndex}
        height={32}
        items={Object.keys(ChartTypes)}
        onSelect={handleSelect}
        renderItem={TimespanItem}
        renderRow={TimespanItemRow}
        width="100%"
      />
    </Container>
  );
};

export default React.memo(TimespanSelector);
