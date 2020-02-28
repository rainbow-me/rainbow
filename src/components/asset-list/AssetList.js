import PropTypes from 'prop-types';
import React from 'react';
import isEqual from 'react-fast-compare';
import { useSafeArea } from 'react-native-safe-area-context';
import { FabWrapper, FloatingActionButton } from '../fab';
import { ListFooter } from '../list';
import EmptyAssetList from './EmptyAssetList';
import RecyclerAssetList from './RecyclerAssetList';

const FabSizeWithPadding =
  FloatingActionButton.size + FabWrapper.bottomPosition * 2;

const AssetList = ({
  fetchData,
  hideHeader,
  isEmpty,
  isWalletEthZero,
  network,
  scrollViewTracker,
  sections,
  ...props
}) => {
  const insets = useSafeArea();

  return isEmpty ? (
    <EmptyAssetList
      {...props}
      hideHeader={hideHeader}
      isWalletEthZero={isWalletEthZero}
      network={network}
    />
  ) : (
    <RecyclerAssetList
      fetchData={fetchData}
      hideHeader={hideHeader}
      paddingBottom={insets.bottom + FabSizeWithPadding - ListFooter.height}
      scrollViewTracker={scrollViewTracker}
      sections={sections}
      {...props}
    />
  );
};

AssetList.propTypes = {
  fetchData: PropTypes.func.isRequired,
  hideHeader: PropTypes.bool,
  isEmpty: PropTypes.bool,
  isWalletEthZero: PropTypes.bool,
  scrollViewTracker: PropTypes.object,
  sections: PropTypes.arrayOf(PropTypes.object),
};

const arePropsEqual = (prev, next) =>
  prev.isEmpty === next.isEmpty &&
  prev.isWalletEthZero === next.isWalletEthZero &&
  prev.sections.length === next.sections.length &&
  isEqual(prev.sections, next.sections);

export default React.memo(AssetList, arePropsEqual);
