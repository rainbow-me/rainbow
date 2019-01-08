import { INITIAL_ASSETS_STATE } from 'balance-common';
import { get, groupBy, isEqual, isNull, omit, toNumber } from 'lodash';
import { sortList } from '../utils';

const EMPTY_ARRAY = [];

const InitialAccountAssetsState = get(INITIAL_ASSETS_STATE, 'assets[0]', {});

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

export const sortAssetsByNativeAmount = (originalAssets, prices, nativeCurrency) => {
  console.log('SORT ASSETS BY NATIVE AMOUNT');
  const { assets, total } = parseNativePrices(originalAssets, nativeCurrency, prices);
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
    assetsTotal: total,
    shitcoins: sortedShitcoins,
    shitcoinsCount: sortedShitcoins.length,
  };
};

const parseNativePrices = (
  assets = null,
  nativeCurrency,
  nativePrices = null,
) => {
  let totalAmount = 0;
  let newAccount = null;
  const newAssets = assets.map(asset => {
    if (
      !nativePrices ||
      (nativePrices && !nativePrices[nativeCurrency][asset.symbol])
    )
      return asset;

    const balanceAmountUnit = convertAmountFromBigNumber(
      asset.balance.amount,
      asset.decimals,
    );
    const balancePriceUnit = convertAmountFromBigNumber(
      nativePrices[nativeCurrency][asset.symbol].price.amount,
    );
    const balanceRaw = multiply(balanceAmountUnit, balancePriceUnit);
    const balanceAmount = convertAmountToBigNumber(balanceRaw);
    let trackingAmount = balanceAmount;
    if (nativeCurrency !== 'USD') {
      const trackingPriceUnit = convertAmountFromBigNumber(
        nativePrices['USD'][asset.symbol].price.amount,
      );
      const trackingRaw = multiply(balanceAmountUnit, trackingPriceUnit);
      trackingAmount = convertAmountToBigNumber(trackingRaw);
    }
    const balanceDisplay = convertAmountToDisplay(
      balanceAmount,
      nativePrices,
    );
    const assetPrice = nativePrices[nativeCurrency][asset.symbol].price;
    return {
      ...asset,
      trackingAmount,
      native: {
        selected: nativePrices.selected,
        balance: { amount: balanceAmount, display: balanceDisplay },
        price: assetPrice,
        change:
          asset.symbol === nativeCurrency
            ? { amount: '0', display: '———' }
            : nativePrices[nativeCurrency][asset.symbol].change,
      },
    };
  });
  totalAmount = newAssets.reduce(
    (total, asset) =>
      add(total, asset.native ? asset.native.balance.amount : 0),
    0,
  );
  const totalUSDAmount = (nativeCurrency === 'USD') ? totalAmount :
    newAssets.reduce(
      (total, asset) =>
        add(total, asset.native ? asset.trackingAmount : 0),
      0,
    );
  const totalDisplay = convertAmountToDisplay(totalAmount, nativePrices);
  const totalTrackingAmount = convertAmountToUnformattedDisplay(totalUSDAmount, 'USD');
  const total = { amount: totalAmount, display: totalDisplay, totalTrackingAmount };
  newAccount = {
    assets: newAssets,
    total: total,
  };
  return newAccount;
};
