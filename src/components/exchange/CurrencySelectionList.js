import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { magicMemo } from '../../utils';
import { EmptyAssetList } from '../asset-list';
import { Centered } from '../layout';
import { NoResults } from '../list';
import { CurrencySelectModalHeaderHeight } from './CurrencySelectModalHeader';
import ExchangeAssetList from './ExchangeAssetList';
import { ExchangeSearchHeight } from './ExchangeSearch';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const EmptyCurrencySelectionList = styled(EmptyAssetList).attrs({
  pointerEvents: 'none',
})({
  ...position.coverAsObject,
  backgroundColor: ({ theme: { colors } }) => colors.white,
});

const NoCurrencyResults = styled(NoResults)({
  paddingBottom: CurrencySelectModalHeaderHeight + ExchangeSearchHeight / 2,
});

const CurrencySelectionList = (
  {
    keyboardDismissMode,
    footerSpacer,
    itemProps,
    listItems,
    loading,
    query,
    scrollIndicatorInsets,
    showList,
    testID,
  },
  ref
) => {
  const noResults = !listItems?.[0]?.data?.length;
  const showGhost = !loading && noResults;
  const showSkeleton = noResults && loading;

  return (
    <View flex={1} testID={testID}>
      {showList && !showSkeleton && (
        <Centered flex={1}>
          {showGhost ? (
            <NoCurrencyResults />
          ) : (
            <ExchangeAssetList
              footerSpacer={footerSpacer}
              itemProps={itemProps}
              items={listItems}
              keyboardDismissMode={keyboardDismissMode}
              query={query}
              ref={ref}
              scrollIndicatorInsets={scrollIndicatorInsets}
              testID={testID}
            />
          )}
        </Centered>
      )}
      {(showSkeleton || !showList) && <EmptyCurrencySelectionList />}
    </View>
  );
};

export default magicMemo(forwardRef(CurrencySelectionList), [
  'listItems',
  'loading',
  'showList',
  'query',
]);
