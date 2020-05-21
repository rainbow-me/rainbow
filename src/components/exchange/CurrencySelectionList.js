import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import { magicMemo } from '../../utils';
import { EmptyAssetList } from '../asset-list';
import { Centered } from '../layout';
import { NoResults } from '../list';
import { CurrencySelectModalHeaderHeight } from './CurrencySelectModalHeader';
import ExchangeAssetList from './ExchangeAssetList';
import { ExchangeSearchHeight } from './ExchangeSearch';

const NoCurrencyResults = styled(NoResults)`
  padding-bottom: ${CurrencySelectModalHeaderHeight + ExchangeSearchHeight / 2};
`;

const skeletonTransition = (
  <Transition.Sequence>
    <Transition.Out interpolation="easeOut" type="fade" />
    <Transition.Change durationMs={0.001} interpolation="easeOut" />
    <Transition.In durationMs={0.001} interpolation="easeOut" type="fade" />
  </Transition.Sequence>
);

const CurrencySelectionList = ({
  itemProps,
  listItems,
  loading,
  showList,
  query,
}) => {
  const skeletonTransitionRef = useRef();
  const [showSkeleton, setShowSkeleton] = useState(true);
  const showNoResults = get(listItems, '[0].data', []).length === 0;

  useEffect(() => {
    if (showSkeleton && !loading) {
      skeletonTransitionRef.current.animateNextTransition();
      setShowSkeleton(false);
    }
  }, [loading, showSkeleton]);

  return (
    <Transitioning.View
      flex={1}
      ref={skeletonTransitionRef}
      transition={skeletonTransition}
    >
      {showList && (
        <Centered flex={1}>
          {showNoResults ? (
            <NoCurrencyResults />
          ) : (
            <ExchangeAssetList
              itemProps={itemProps}
              items={listItems}
              query={query}
            />
          )}
        </Centered>
      )}
      {(showSkeleton || !showList) && (
        <EmptyAssetList
          {...position.coverAsObject}
          backgroundColor={colors.white}
          pointerEvents="none"
        />
      )}
    </Transitioning.View>
  );
};

CurrencySelectionList.propTypes = {
  itemProps: PropTypes.object,
  listItems: PropTypes.array,
  query: PropTypes.string,
  showList: PropTypes.bool,
};

export default magicMemo(CurrencySelectionList, ['listItems', 'showList']);
