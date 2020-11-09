import React from 'react';
import styled from 'styled-components/primitives';
import { ColumnWithMargins } from '../layout';
import { SlackSheet } from '../sheet';
import { Text } from '../text';
import DiscoverSheetHeader from './DiscoverSheetHeader';
import PulseIndex from './PulseIndexSection';
import SearchHeader from './SearchHeader';
import Strategies from './StrategiesSection';
import TopMoversSection from './TopMoversSection';
import UniswapPools from './UniswapPoolsSection';
import { colors, position } from '@rainbow-me/styles';

const renderHeader = yPosition => <DiscoverSheetHeader yPosition={yPosition} />;

const HeaderTitle = styled(Text).attrs({
  align: 'center',
  color: colors.blueGreyDark,
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  opacity: 0.8,
  size: 'large',
  weight: 'bold',
})``;

export default function DiscoverSheetContent() {
  return (
    <SlackSheet contentOffset={position.current} renderHeader={renderHeader}>
      <HeaderTitle>Discover</HeaderTitle>
      <ColumnWithMargins flex={1} margin={42}>
        <SearchHeader />
        <TopMoversSection />
        <PulseIndex />
        <Strategies />
        <UniswapPools />
      </ColumnWithMargins>
    </SlackSheet>
  );
}
