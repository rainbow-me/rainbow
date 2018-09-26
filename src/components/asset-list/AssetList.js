import { INITIAL_ACCOUNT_STATE } from 'balance-common';
import { get, isEqual, omit } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys, withProps, withState } from 'recompact';
import { withHideSplashScreen, withSafeAreaViewInsetValues } from '../../hoc';
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
        <SectionList
          contentContainerStyle={{
            // We want to add enough spacing below the list so that when the user scrolls to the bottom,
            // the bottom of the list content lines up with the top of the FABs (+ padding).
            paddingBottom: buildListBottomPadding(safeAreaInset),
          }}
          enablePullToRefresh
          fetchData={fetchData}
          keyExtractor={assetListKeyExtractor}
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
  onPressWalletConnect: PropTypes.func,
  onSectionsLoaded: PropTypes.func,
  safeAreaInset: PropTypes.object,
  sections: PropTypes.arrayOf(PropTypes.object),
};

const InitialAccountAssetsState = get(INITIAL_ACCOUNT_STATE, 'accountInfo.assets[0]', {});

const isInitialAccountAssetsState = (sectionData) => {
  const currentBalance = get(sectionData, 'balance.display');
  const initialBalance = get(InitialAccountAssetsState, 'balance.display');

  if (!isEqual(currentBalance, initialBalance)) {
    return false;
  }

  const currentState = omit(sectionData, ['balance', 'native']);
  const initialState = omit(InitialAccountAssetsState, ['balance', 'native']);

  return isEqual(currentState, initialState);
};

export default compose(
  withState('didLoad', 'toggleDidLoad', false),
  withHideSplashScreen,
  withSafeAreaViewInsetValues,
  withProps(({
    didLoad,
    onSectionsLoaded,
    sections,
    toggleDidLoad,
  }) => {
    let isEmpty = false;

    if (!didLoad && (sections && sections.length)) {
      onSectionsLoaded();
      toggleDidLoad(true);
    }

    if (sections.length === 1) {
      isEmpty = isInitialAccountAssetsState(sections[0].data[0]);
    }

    return { isEmpty };
  }),
  onlyUpdateForKeys(['isEmpty', 'sections']),
)(AssetList);
