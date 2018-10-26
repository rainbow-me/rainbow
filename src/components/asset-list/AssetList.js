import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withHandlers, withState } from 'recompact';
import { withSafeAreaViewInsetValues } from '../../hoc';
import { FabWrapper, FloatingActionButton } from '../fab';
import { ListFooter, SectionList } from '../list';
import { get } from 'lodash';
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

const AssetList = ({
  fetchData,
  isEmpty,
  safeAreaInset,
  sections,
  hideHeader,
  onLayout,
  ...props
}) => (isEmpty ? (
  <AssetListSkeleton onLayout={onLayout} />
) : (
  <SectionList
    contentContainerStyle={{
      // We want to add enough spacing below the list so that when the user scrolls to the bottom,
      // the bottom of the list content lines up with the top of the FABs (+ padding).
      paddingBottom: buildListBottomPadding(safeAreaInset),
    }}
    enablePullToRefresh
    fetchData={fetchData}
    keyExtractor={assetListKeyExtractor}
    onLayout={onLayout}
    renderItem={AssetListItem}
    renderSectionHeader={!hideHeader && (({ section }) => <AssetListHeader {...section} />)}
    sections={sections}
    hideHeader={hideHeader}
  />
));

AssetList.propTypes = {
  fetchData: PropTypes.func.isRequired,
  hideHeader: PropTypes.bool,
  isEmpty: PropTypes.bool,
  onLayout: PropTypes.func,
  onSectionsLoaded: PropTypes.func,
  safeAreaInset: PropTypes.object,
  sections: PropTypes.arrayOf(PropTypes.object),
};

export default compose(
  withState('didLoad', 'toggleDidLoad', false),
  withSafeAreaViewInsetValues,
  withHandlers({
    onLayout: ({ didLoad, onSectionsLoaded, toggleDidLoad }) => () => {
      if (!didLoad) {
        if (typeof onSectionsLoaded === 'function') {
          onSectionsLoaded();
        }

        toggleDidLoad(true);
      }
    },
  }),
  onlyUpdateForKeys(['isEmpty', 'sections']),
)(AssetList);
