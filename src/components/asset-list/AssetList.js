import lang from 'i18n-js';
import React from 'react';
import { magicMemo } from '../../utils';
import EmptyAssetList from './EmptyAssetList';
import RecyclerAssetList2 from './RecyclerAssetList2';

const AssetList = ({
  hideHeader,
  isEmpty,
  isWalletEthZero,
  network,
  ...props
}) => {
  return isEmpty ? (
    <EmptyAssetList
      {...props}
      hideHeader={hideHeader}
      isWalletEthZero={isWalletEthZero}
      network={network}
      title={lang.t('account.tab_balances')}
    />
  ) : (
    <RecyclerAssetList2 />
  );
};

export default magicMemo(AssetList, ['isEmpty', 'isWalletEthZero', 'sections']);
