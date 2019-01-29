import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys } from 'recompact';
import { withSafeAreaViewInsetValues } from '../../hoc';
import { FabWrapper, FloatingActionButton } from '../fab';
import { ListFooter, SectionList } from '../list';
import AssetListHeader from './AssetListHeader';
import AssetListItem from './AssetListItem';
import AssetListSkeleton from './AssetListSkeleton';

const assetListKeyExtractor = (item, index) => (
  get(item, Array.isArray(item) ? '[0].id' : 'symbol') + index
);

const buildListBottomPadding = (safeAreaInset) => {
  const fabSizeWithPadding = FloatingActionButton.size + (FabWrapper.bottomPosition * 2);
  return (safeAreaInset.bottom + fabSizeWithPadding) - ListFooter.height;
};

// eslint-disable-next-line react/prop-types
const AssetListHeaderRenderer = ({ section }) => <AssetListHeader {...section} />;

const AssetList = ({
  fetchData,
  hideHeader,
  isEmpty,
  safeAreaInset,
  sections,
  ...props
}) => (
  (isEmpty) ? (
    <AssetListSkeleton />
  ) : (
    <SectionList
      contentContainerStyle={{
        // We want to add enough spacing below the list so that when the user scrolls to the bottom,
        // the bottom of the list content lines up with the top of the FABs (+ padding).
        paddingBottom: buildListBottomPadding(safeAreaInset),
      }}
      enablePullToRefresh
      fetchData={fetchData}
      hideHeader={hideHeader}
      keyExtractor={assetListKeyExtractor}
      renderItem={AssetListItem}
      renderSectionHeader={hideHeader ? null : AssetListHeaderRenderer}
      sections={sections}
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
