import React, { forwardRef, ForwardRefRenderFunction } from 'react';
import { SectionList } from 'react-native';
import { magicMemo } from '@/utils';
import { EmptyAssetList } from '@/components/asset-list';
import { Centered } from '@/components/layout';
import { NoResults } from '@/components/list';
import ExchangeAssetList, { EnrichedExchangeAsset } from '@/components/ExchangeAssetList';
import { Box } from '@/design-system';
import { NoResultsType } from '@/components/list/NoResults';

const CurrencySelectModalHeaderHeight = 59;
const SearchHeight = 40;

interface CurrencySelectionListProps {
  keyboardDismissMode?: 'none' | 'interactive' | 'on-drag';
  footerSpacer: boolean;
  fromDiscover?: boolean;
  itemProps: {
    onPress: (item: any) => void;
    showBalance: boolean;
    showFavoriteButton: boolean;
  };
  listItems: { data: EnrichedExchangeAsset[]; title: string }[];
  loading: boolean;
  onL2?: boolean;
  query: string;
  showList: boolean;
  testID: string;
  isExchangeList?: boolean;
}

const CurrencySelectionList: ForwardRefRenderFunction<SectionList, CurrencySelectionListProps> = (
  { keyboardDismissMode, footerSpacer, fromDiscover, itemProps, listItems, loading, onL2, query, showList, testID, isExchangeList = false },
  ref
) => {
  const noResults = !listItems?.[0]?.data?.length;
  const showGhost = !loading && noResults;
  const showSkeleton = noResults && loading;

  return (
    <Box flexGrow={1} testID={testID}>
      {showList && !showSkeleton && showGhost ? (
        <Box
          height="full"
          justifyContent="center"
          paddingBottom={{
            custom: CurrencySelectModalHeaderHeight + SearchHeight / 2,
          }}
        >
          {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
          {/* @ts-ignore */}
          <NoResults onL2={onL2} type={fromDiscover ? NoResultsType.Discover : NoResultsType.Swap} />
        </Box>
      ) : (
        <Centered flex={1}>
          <ExchangeAssetList
            footerSpacer={footerSpacer}
            itemProps={itemProps}
            items={listItems}
            keyboardDismissMode={keyboardDismissMode}
            query={query}
            ref={ref}
            testID={testID}
            isExchangeList={isExchangeList}
          />
        </Centered>
      )}
      {(showSkeleton || !showList) && <Box as={EmptyAssetList} width="full" height="full" style={{ pointerEvents: 'none' }} />}
    </Box>
  );
};

export default magicMemo(forwardRef(CurrencySelectionList), ['listItems', 'loading', 'showList', 'query', 'itemProps']);
