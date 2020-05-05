import React, { useCallback } from 'react';
import styled from 'styled-components/primitives';
import ChartTypes from '../../helpers/chartTypes';
import { colors, padding } from '../../styles';
import { JellySelector } from '../jelly-selector';
import { Centered, Row } from '../layout';
import { Text } from '../text';

const TimespanItemLabel = styled(Text).attrs({
  align: 'center',
  letterSpacing: 'roundedTightest',
  size: 'smedium',
  weight: 'semibold',
})`
  ${padding(0, 8)};
  color: ${({ isSelected }) => (isSelected ? colors.dark : colors.grey)};
`;

const TimespanItem = ({ isSelected, item, ...props }) => (
  <Centered flexShrink={0} height={32} {...props}>
    <TimespanItemLabel isSelected={isSelected}>
      {ChartTypes[item] === ChartTypes.max
        ? 'MAX'
        : `1${item.charAt(0).toUpperCase()}`}
    </TimespanItemLabel>
  </Centered>
);

const TimespanItemRow = props => (
  <Row justify="space-between" paddingHorizontal={15} {...props} />
);

const TimespanSelector = ({ color, defaultIndex = 0, reloadChart }) => {
  const handleSelect = useCallback(
    newTimespan => reloadChart(ChartTypes[newTimespan]),
    [reloadChart]
  );

  return (
    <Centered width="100%">
      <JellySelector
        backgroundColor={color}
        defaultIndex={defaultIndex}
        height={32}
        items={Object.keys(ChartTypes)}
        onSelect={handleSelect}
        renderItem={TimespanItem}
        renderRow={TimespanItemRow}
        width="100%"
      />
    </Centered>
  );
};

export default React.memo(TimespanSelector);
