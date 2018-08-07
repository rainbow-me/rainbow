import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { SectionList } from 'react-native';
import { compose, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import { withSafeAreaViewInsetValues } from '../../hoc';
import { colors, position } from '../../styles';
import { FabWrapper, FloatingActionButton, WalletConnectFab } from '../fab';
import { FlexItem } from '../layout';
import AssetListHeader from './AssetListHeader';
import AssetListItem from './AssetListItem';
import AssetListFooter from './AssetListFooter';
import AssetListSkeleton from './AssetListSkeleton';

const List = styled(SectionList)`
  ${position.size('100%')}
  background-color: ${colors.white};
`;

const assetListKeyExtractor = (item, index) => (
  get(item, Array.isArray(item) ? '[0].id' : 'symbol') + index
);

const buildListBottomPadding = (safeAreaInset) => {
  const fabSizeWithPadding = FloatingActionButton.size + (FabWrapper.bottomPosition * 2);
  return (safeAreaInset.bottom + fabSizeWithPadding) - AssetListFooter.height;
};

const AssetList = ({
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
        <List
          contentContainerStyle={{
            // We want to add enough spacing below the list so that when the user scrolls to the bottom,
            // the bottom of the list content lines up with the top of the FABs (+ padding).
            paddingBottom: buildListBottomPadding(safeAreaInset),
          }}
          keyExtractor={assetListKeyExtractor}
          renderItem={AssetListItem}
          renderSectionFooter={AssetListFooter}
          renderSectionHeader={headerProps => <AssetListHeader {...headerProps} />}
          scrollIndicatorInsets={{
            bottom: buildListBottomPadding(safeAreaInset) + AssetListFooter.height,
            top: AssetListHeader.height,
          }}
          sections={sections}
        />
      )}
    </FabWrapper>
  </FlexItem>
);

AssetList.propTypes = {
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
