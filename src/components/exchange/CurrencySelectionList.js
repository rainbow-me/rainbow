import { get } from 'lodash';
import React, { forwardRef, useEffect, useRef } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import { magicMemo } from '../../utils';
import { EmptyAssetList } from '../asset-list';
import { Centered } from '../layout';
import { NoResults } from '../list';
import { CurrencySelectModalHeaderHeight } from './CurrencySelectModalHeader';
import ExchangeAssetList from './ExchangeAssetList';
import { ExchangeSearchHeight } from './ExchangeSearch';
import { usePrevious } from '@rainbow-me/hooks';
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

const skeletonTransition = (
  <Transition.Sequence>
    <Transition.Out interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={0.001} interpolation="easeOut" />
    <Transition.In durationMs={0.001} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

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
  const skeletonTransitionRef = useRef();
  const noResults = get(listItems, '[0].data', []).length === 0;
  const showGhost = !loading && noResults;
  const showSkeleton = noResults && loading;
  const prevShowSkeleton = usePrevious(showSkeleton);

  useEffect(() => {
    if (!showSkeleton && prevShowSkeleton && ios) {
      skeletonTransitionRef.current?.animateNextTransition();
    }
  }, [prevShowSkeleton, showSkeleton]);

  return (
    <Transitioning.View
      flex={1}
      ref={skeletonTransitionRef}
      testID={testID}
      transition={skeletonTransition}
    >
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
    </Transitioning.View>
  );
};

export default magicMemo(forwardRef(CurrencySelectionList), [
  'listItems',
  'loading',
  'showList',
]);
