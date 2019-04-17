import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys } from 'recompact';
import { withSafeAreaViewInsetValues } from '../../hoc';
import { FabWrapper, FloatingActionButton } from '../fab';
import { ListFooter } from '../list';
import AssetListSkeleton from './AssetListSkeleton';
import List from './RecyclerAssetList';

const buildListBottomPadding = (safeAreaInset) => {
  const fabSizeWithPadding = FloatingActionButton.size + (FabWrapper.bottomPosition * 2);
  return (safeAreaInset.bottom + fabSizeWithPadding) - ListFooter.height;
};

const AssetList = ({
  fetchData,
  hideHeader,
  isEmpty,
  safeAreaInset,
  sections,
}) => (
  (isEmpty) ? (
    <AssetListSkeleton />
  ) : (
    <List
      fetchData={fetchData}
      enablePullToRefresh
      sections={sections}
      hideHeader={hideHeader}
      paddingBottom={buildListBottomPadding(safeAreaInset)}
    />
  )
);

AssetList.propTypes = {
  fetchData: PropTypes.func.isRequired,
  hideHeader: PropTypes.bool,
  isEmpty: PropTypes.bool,
  safeAreaInset: PropTypes.object,
  sections: PropTypes.arrayOf(PropTypes.object),
};

export default compose(
  withSafeAreaViewInsetValues,
  onlyUpdateForKeys(['isEmpty', 'sections']),
)(AssetList);
