import { INITIAL_ACCOUNT_STATE } from 'balance-common';
import { get, groupBy, isEqual, isNull, omit, toNumber } from 'lodash';
import { sortList } from '../utils';

const EMPTY_ARRAY = [];

const InitialAccountAssetsState = get(INITIAL_ACCOUNT_STATE, 'accountInfo.assets[0]', {});

export const areAssetsEqualToInitialAccountAssetsState = (sectionData) => {
  const currentBalance = get(sectionData, 'balance.display');
  const initialBalance = get(InitialAccountAssetsState, 'balance.display');

  if (!isEqual(currentBalance, initialBalance)) {
    return false;
  }

  const currentState = omit(sectionData, ['balance', 'native']);
  const initialState = omit(InitialAccountAssetsState, ['balance', 'native']);

  return isEqual(currentState, initialState);
};

export const buildUniqueTokenList = (uniqueTokensAssets) => {
  const list = [];

  for (let i = 0; i < uniqueTokensAssets.length; i += 2) {
    list.push([uniqueTokensAssets[i], uniqueTokensAssets[i + 1]]);
  }

  return list;
};

export const buildUniqueTokenName = ({ asset_contract, id, name }) => (
  name || `${asset_contract.name} #${id}`
);

export const groupAssetsByMarketValue = assets => groupBy(assets, ({ native }) => (
  isNull(native) ? 'noValue' : 'hasValue'
));

export const sortAssetsByNativeAmount = (assets) => {
  const {
    hasValue = EMPTY_ARRAY,
    noValue = EMPTY_ARRAY,
  } = groupAssetsByMarketValue(assets);

  const sortedAssets = sortList(hasValue, 'native.balance.amount', 'desc', 0, toNumber);
  const sortedShitcoins = sortList(noValue, 'name', 'asc');
  const allAssets = sortedAssets.concat(sortedShitcoins);

  return {
    allAssets,
    allAssetsCount: allAssets.length,
    assets: sortedAssets,
    assetsCount: sortedAssets.length,
    shitcoins: sortedShitcoins,
    shitcoinsCount: sortedShitcoins.length,
  };
};
