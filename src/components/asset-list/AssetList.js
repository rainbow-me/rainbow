import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { safeAreaInsetValues } from '../../utils';
import { FabWrapper, FloatingActionButton } from '../fab';
import { ListFooter } from '../list';
import AssetListSkeleton from './AssetListSkeleton';
import RecyclerAssetList from './RecyclerAssetList';

const FabSizeWithPadding = FloatingActionButton.size + (FabWrapper.bottomPosition * 2);
const PaddingBottom = (safeAreaInsetValues.bottom + FabSizeWithPadding) - ListFooter.height;

const AssetList = ({
  fetchData,
  hideHeader,
  isEmpty,
  isWalletEthZero,
  sections,
  ...props
}) => (
  isEmpty
    ? <AssetListSkeleton {...props} />
    : (
      <RecyclerAssetList
        {...props}
        enablePullToRefresh
        fetchData={fetchData}
        hideHeader={hideHeader}
        paddingBottom={PaddingBottom}
        sections={sections}
      />
    )
);

AssetList.propTypes = {
  fetchData: PropTypes.func.isRequired,
  hideHeader: PropTypes.bool,
  isEmpty: PropTypes.bool,
  isWalletEthZero: PropTypes.bool,
  sections: PropTypes.arrayOf(PropTypes.object),
};

export default onlyUpdateForKeys([
  'isEmpty',
  'isWalletEthZero',
  'sections',
])(AssetList);
