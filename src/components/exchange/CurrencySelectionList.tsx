import { get } from 'lodash';
import React, { forwardRef, useEffect, useRef } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components';
import { magicMemo } from '../../utils';
import { EmptyAssetList } from '../asset-list';
import { Centered } from '../layout';
import { NoResults } from '../list';
// @ts-expect-error ts-migrate(6142) FIXME: Module './CurrencySelectModalHeader' was resolved ... Remove this comment to see the full error message
import { CurrencySelectModalHeaderHeight } from './CurrencySelectModalHeader';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExchangeAssetList' was resolved to '/Use... Remove this comment to see the full error message
import ExchangeAssetList from './ExchangeAssetList';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExchangeSearch' was resolved to '/Users/... Remove this comment to see the full error message
import { ExchangeSearchHeight } from './ExchangeSearch';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { usePrevious } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const EmptyCurrencySelectionList = styled(EmptyAssetList).attrs({
  pointerEvents: 'none',
})`
  ${position.cover};
  background-color: ${({ theme: { colors } }) => colors.white};
`;

const NoCurrencyResults = styled(NoResults)`
  padding-bottom: ${CurrencySelectModalHeaderHeight + ExchangeSearchHeight / 2};
`;

const skeletonTransition = (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Transition.Sequence>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Out interpolation="easeOut" type="fade" />
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Change durationMs={0.001} interpolation="easeOut" />
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
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
  }: any,
  ref: any
) => {
  const skeletonTransitionRef = useRef();
  const showNoResults = get(listItems, '[0].data', []).length === 0;
  const showSkeleton = showNoResults && loading;
  const prevShowSkeleton = usePrevious(showSkeleton);

  useEffect(() => {
    if (!showSkeleton && prevShowSkeleton) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'animateNextTransition' does not exist on... Remove this comment to see the full error message
      skeletonTransitionRef.current?.animateNextTransition();
    }
  }, [loading, prevShowSkeleton, showSkeleton]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Transitioning.View
      flex={1}
      // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
      ref={skeletonTransitionRef}
      testID={testID}
      transition={skeletonTransition}
    >
      {showList && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Centered flex={1}>
          {showNoResults ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <NoCurrencyResults />
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      {(showSkeleton || !showList) && <EmptyCurrencySelectionList />}
    </Transitioning.View>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(forwardRef(CurrencySelectionList), [
  'listItems',
  'showList',
]);
