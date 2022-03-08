import { get } from 'lodash';
import React, { forwardRef } from 'react';
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
    showList,
    testID,
  },
  ref
) => {
  const noResults = get(listItems, '[0].data', []).length === 0;
  const showGhost = !loading && noResults;
  const showSkeleton = noResults && loading;

  return (
    <>
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
              testID={testID}
            />
          )}
        </Centered>
      )}
      {(showSkeleton || !showList) && <EmptyCurrencySelectionList />}
    </>
  );
};

export default magicMemo(forwardRef(CurrencySelectionList), [
  'listItems',
  'loading',
  'showList',
]);
