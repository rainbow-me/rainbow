import PropTypes from 'prop-types';
import React, { useCallback, useRef } from 'react';
import { SectionList } from 'react-native-gesture-handler';
import styled from 'styled-components/primitives';
import { usePrevious } from '../../hooks';
import { exchangeModalBorderRadius } from '../../screens/ExchangeModal';
import { colors, padding } from '../../styles';
import { magicMemo } from '../../utils';
import { CoinRowHeight, ExchangeCoinRow } from '../coin-row';
import { Text } from '../text';

const Header = styled.View`
  ${padding(12, 19, 6)};
  background-color: ${colors.white};
  flex: 1;
`;

const HeaderTitle = styled(Text).attrs({
  color: colors.blueGreyDark,
  opacity: 0.4,
  size: 'smaller',
  weight: 'semibold',
})`
  ${padding(12, 19, 6)};
  background-color: ${colors.white};
  flex: 1;
`;

const ExchangeAssetSectionListHeader = ({ section }) =>
  section?.title ? (
    <Header>
      <HeaderTitle>{section.title}</HeaderTitle>
    </Header>
  ) : null;

const contentContainerStyle = { paddingBottom: exchangeModalBorderRadius };
const keyExtractor = ({ uniqueId }) => `ExchangeAssetList-${uniqueId}`;
const scrollIndicatorInsets = { bottom: exchangeModalBorderRadius };
const getItemLayout = ({ showBalance }, index) => {
  const height = showBalance ? CoinRowHeight + 1 : CoinRowHeight;
  return {
    index,
    length: height,
    offset: height * index,
  };
};

const ExchangeAssetSectionList = styled(SectionList).attrs({
  alwaysBounceVertical: true,
  contentContainerStyle,
  directionalLockEnabled: true,
  getItemLayout,
  initialNumToRender: 8,
  keyboardDismissMode: 'none',
  keyboardShouldPersistTaps: 'always',
  keyExtractor,
  scrollEventThrottle: 32,
  scrollIndicatorInsets,
  windowSize: 11,
})`
  height: 100%;
`;

const ExchangeAssetList = ({ itemProps, items, onLayout, query }) => {
  const sectionListRef = useRef();
  const prevQuery = usePrevious(query);

  // Scroll to top once the query is cleared
  if (prevQuery && prevQuery.length && !query.length) {
    sectionListRef.current.scrollToLocation({
      animated: true,
      itemIndex: 0,
      sectionIndex: 0,
      viewOffset: 0,
      viewPosition: 0,
    });
  }

  const createItem = useCallback(item => Object.assign(item, itemProps), [
    itemProps,
  ]);

  const renderItemCallback = useCallback(
    ({ item }) => <ExchangeCoinRow {...itemProps} item={item} />,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <ExchangeAssetSectionList
      onLayout={onLayout}
      ref={sectionListRef}
      renderItem={renderItemCallback}
      renderSectionHeader={ExchangeAssetSectionListHeader}
      sections={items.map(createItem)}
    />
  );
};

ExchangeAssetList.propTypes = {
  itemProps: PropTypes.object,
  items: PropTypes.array.isRequired,
  onLayout: PropTypes.func,
  query: PropTypes.string,
};

export default magicMemo(ExchangeAssetList, ['items', 'query']);
