import PropTypes from 'prop-types';
import React from 'react';
import { compose, onlyUpdateForKeys } from 'recompact';
import { withIsWalletImporting } from '../../hoc';
import { safeAreaInsetValues } from '../../utils';
import { FabWrapper, FloatingActionButton } from '../fab';
import { ListFooter } from '../list';
import EmptyAssetList from './EmptyAssetList';
import RecyclerAssetList from './RecyclerAssetList';

const FabSizeWithPadding = FloatingActionButton.size + (FabWrapper.bottomPosition * 2);
const PaddingBottom = (safeAreaInsetValues.bottom + FabSizeWithPadding) - ListFooter.height;

const AssetList = ({
  fetchData,
  hideHeader,
  isEmpty,
  isImporting,
  isWalletEthZero,
  scrollViewTracker,
  sections,
  ...props
}) => (
  (isEmpty || isImporting)
    ? (
      <EmptyAssetList
        {...props}
        hideHeader={hideHeader}
        isWalletEthZero={isImporting ? false : isWalletEthZero}
      />
    ) : (
      <RecyclerAssetList
        fetchData={fetchData}
        hideHeader={hideHeader}
        paddingBottom={PaddingBottom}
        scrollViewTracker={scrollViewTracker}
        sections={sections}
        {...props}
      />
    )
);

AssetList.propTypes = {
  fetchData: PropTypes.func.isRequired,
  hideHeader: PropTypes.bool,
  isEmpty: PropTypes.bool,
  isImporting: PropTypes.bool,
  isWalletEthZero: PropTypes.bool,
  scrollViewTracker: PropTypes.object,
  sections: PropTypes.arrayOf(PropTypes.object),
};

export default compose(
  withIsWalletImporting,
  onlyUpdateForKeys([
    'isEmpty',
    'isImporting',
    'isWalletEthZero',
    'sections',
  ]),
)(AssetList);
