import lang from 'i18n-js';
import { times } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { withNeverRerender } from '../../hoc';
import { position } from '../../styles';
import AddFundsInterstitial from '../AddFundsInterstitial';
import { FabWrapper } from '../fab';
import { Centered, Column } from '../layout';
import AssetListHeader from './AssetListHeader';
import AssetListItemSkeleton from './AssetListItemSkeleton';

const InterstitialOffset = AssetListHeader.height + FabWrapper.bottomPosition;

const renderSkeleton = (index, isWalletEthZero) => (
  <AssetListItemSkeleton
    animated={!isWalletEthZero}
    descendingOpacity={isWalletEthZero}
    index={index}
    key={`skeleton${index}`}
  />
);

const EmptyAssetList = ({ isWalletEthZero, ...props }) => (
  <Column {...props} style={position.sizeAsObject('100%')}>
    <AssetListHeader title={lang.t('account.tab_balances')} />
    <Centered flex={1}>
      <Column style={position.coverAsObject}>
        {times(5, index => renderSkeleton(index, isWalletEthZero))}
      </Column>
      {isWalletEthZero && (<AddFundsInterstitial offsetY={InterstitialOffset * -1} />)}
    </Centered>
  </Column>
);

EmptyAssetList.propTypes = {
  isWalletEthZero: PropTypes.bool,
};

export default withNeverRerender(EmptyAssetList);
