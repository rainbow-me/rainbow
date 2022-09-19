import React, { forwardRef, ForwardRefRenderFunction } from 'react';
import { SectionList } from 'react-native';
import { magicMemo } from '../../utils';
import { EmptyAssetList } from '../asset-list';
import { Centered } from '../layout';
import { NoResults } from '../list';
import { CurrencySelectModalHeaderHeight } from './CurrencySelectModalHeader';
import ExchangeAssetList from './ExchangeAssetList';
import { ExchangeSearchHeight } from './ExchangeSearch';
import { Box } from '@/design-system';
import { EnrichedExchangeAsset } from '@/screens/CurrencySelectModal';

interface CurrencySelectionListProps {
  keyboardDismissMode?: 'none' | 'interactive' | 'on-drag';
  footerSpacer: boolean;
  itemProps: {
    onActionAsset: (asset: any, isFavorited?: any) => void;
    onPress: (item: any) => void;
    showBalance: boolean;
    showFavoriteButton: boolean;
  };
  listItems: { data: EnrichedExchangeAsset[]; title: string }[];
  loading: boolean;
  query: string;
  showList: boolean;
  testID: string;
}

const CurrencySelectionList: ForwardRefRenderFunction<
  SectionList,
  CurrencySelectionListProps
> = (
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
  const noResults = !listItems?.[0]?.data?.length;
  const showGhost = !loading && noResults;
  const showSkeleton = noResults && loading;

  return (
    <Box flexGrow={1} testID={testID}>
      {showList && !showSkeleton && (
        <Centered flex={1}>
          {showGhost ? (
            <Box
              as={NoResults}
              paddingBottom={{
                custom:
                  CurrencySelectModalHeaderHeight + ExchangeSearchHeight / 2,
              }}
            />
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
      {(showSkeleton || !showList) && (
        <Box
          as={EmptyAssetList}
          width="full"
          height="full"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </Box>
  );
};

export default magicMemo(forwardRef(CurrencySelectionList), [
  'listItems',
  'loading',
  'showList',
  'query',
]);
