import React from 'react';
import { useTopMovers } from '../../hooks';
import { ColumnWithMargins } from '../layout';
import { MarqueeList } from '../list';
import { Text } from '../text';

const TopMoversSection = () => {
  const { gainers, losers } = useTopMovers();
  return (
    <ColumnWithMargins margin={15}>
      <Text size="larger" weight="bold">
        Top Movers
      </Text>
      <MarqueeList items={gainers} />
      <MarqueeList items={losers} />
    </ColumnWithMargins>
  );
};

export default TopMoversSection;
