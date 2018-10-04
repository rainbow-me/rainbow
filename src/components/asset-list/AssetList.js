import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withHandlers, withState } from 'recompact';
import { withSafeAreaViewInsetValues } from '../../hoc';
import { FabWrapper, FloatingActionButton, WalletConnectFab } from '../fab';
import { ListFooter, SectionList } from '../list';
import { FlexItem } from '../layout';
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

const renderSectionHeader = ({ section }) => <AssetListHeader {...section} />;

const AssetList = ({
  fetchData,
  isEmpty,
  onPressWalletConnect,
  onSectionsLoaded,
  safeAreaInset,
  sections,
  onLayout,
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
        <AssetListSkeleton onLayout={onLayout}/>
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
          renderSectionHeader={renderSectionHeader}
          sections={sections}
        />
      )}
    </FabWrapper>
  </FlexItem>
);

AssetList.propTypes = {
  fetchData: PropTypes.func.isRequired,
  isEmpty: PropTypes.bool,
  onLayout: PropTypes.func,
  onPressWalletConnect: PropTypes.func,
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
        onSectionsLoaded();
        toggleDidLoad(true);
      }
    },
  }),
  onlyUpdateForKeys(['isEmpty', 'sections']),
)(AssetList);
