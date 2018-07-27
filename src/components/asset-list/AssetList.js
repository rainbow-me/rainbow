import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, withProps } from 'recompact';
import { withSafeAreaViewInsetValues } from '../../hoc';
import { FabWrapper, FloatingActionButton, WalletConnectFab } from '../fab';
import { ListFooter, SectionList } from '../list';
import { FlexItem } from '../layout';
import RefreshableList from '../RefreshableList';
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
  onPressWalletConnect,
  safeAreaInset,
  sections,
  ...props
}) => (
  <FlexItem>
    <FabWrapper
      items={[(
        <WalletConnectFab
          disabled={isEmpty}
          key="walletConnectFab"
          onPress={onPressWalletConnect}
        />
      )]}
    >
      {isEmpty ? (
        <AssetListSkeleton />
      ) : (
        <RefreshableList
          contentContainerStyle={{
            // We want to add enough spacing below the list so that when the user scrolls to the bottom,
            // the bottom of the list content lines up with the top of the FABs (+ padding).
            paddingBottom: buildListBottomPadding(safeAreaInset),
          }}
          fetchData={fetchData}
          keyExtractor={assetListKeyExtractor}
          renderItem={AssetListItem}
          renderSectionHeader={({ section }) => <AssetListHeader {...section} />}
          sections={sections}
        />
      )}
    </FabWrapper>
  </FlexItem>
);

AssetList.propTypes = {
  fetchData: PropTypes.func.isRequired,
  isEmpty: PropTypes.bool,
  onPressWalletConnect: PropTypes.func,
  safeAreaInset: PropTypes.object,
  sections: PropTypes.arrayOf(PropTypes.object),
};

export default compose(
  withSafeAreaViewInsetValues,
  withProps(({ sections }) => {
    let isEmpty = true;

    for (let i = 0; i < sections.length; i += 1) {
      if (!isEmpty) break;
      isEmpty = !sections[i].totalItems;
    }

    return { isEmpty };
  }),
)(AssetList);
