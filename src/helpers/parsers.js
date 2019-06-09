import { flatten, get, pick } from 'lodash';
import {
  convertAmountToDisplay,
  convertAssetAmountToBigNumber,
  convertAmountFromBigNumber,
  convertAmountToBigNumber,
  multiply,
  simpleConvertAmountToDisplay,
} from '@rainbow-me/rainbow-common';

export const parseTransactions = (data, nativeCurrency) => {
  const allTxns = data.map(txn => parseTransaction(txn, nativeCurrency));
  return flatten(allTxns);
};

const parseTransaction = (txn, nativeCurrency) => {
  let transaction = pick(txn, ['hash', 'nonce', 'protocol', 'status', 'mined_at']);
  transaction['pending'] = false;
  const changes = get(txn, 'changes', []);
  return changes.map((internalTxn, index) => {
    //TODO turn this into a util function
    const tokenBalance = convertAmountFromBigNumber(
      internalTxn.value,
      internalTxn.asset.decimals,
    );
    // TODO: balance Amount Unit to display
    const nativePriceUnit = internalTxn.price || 0;
    const nativeBalanceRaw = multiply(tokenBalance, nativePriceUnit);
    const nativeDisplay = simpleConvertAmountToDisplay(
      convertAmountToBigNumber(nativeBalanceRaw),
      nativeCurrency,
    );

    const assetBalance = convertAssetAmountToBigNumber(
      internalTxn.value,
      internalTxn.asset.decimals,
    );
    return {
      ...transaction,
      asset: internalTxn.asset,
      hash: `${transaction.hash}-${index}`,
      from: internalTxn.address_from,
      native: {
        display: nativeDisplay,
      },
      to: internalTxn.address_to,
      value: {
        amount: tokenBalance,
        display: convertAmountToDisplay(assetBalance, {
          symbol: internalTxn.asset.symbol.toUpperCase(),
          decimals: internalTxn.asset.decimals,
        }),
      }
    };
  });

};

/**
 * @desc parse account assets
 * @param  {Object} [data]
 * @return {Array}
 */
export const parseAccountAssets = data => {
  try {
    let assets = [...data];
    assets = assets.map(assetData => {
      const name =
        assetData.asset.name || 'Unknown Token';
      const asset = {
        address: assetData.asset.asset_code || null,
        decimals: assetData.asset.decimals,
        name: name,
        price: assetData.asset.price,
        symbol: assetData.asset.symbol.toUpperCase() || '———',
        uniqueId: assetData.asset.asset_code || name,
      };
      const assetBalance = convertAssetAmountToBigNumber(
        assetData.quantity,
        asset.decimals,
      );
      return {
        ...asset,
        balance: {
          amount: assetBalance,
          display: convertAmountToDisplay(assetBalance, {
            symbol: asset.symbol,
            decimals: asset.decimals,
          }),
        },
      };
    });

    assets = assets.filter(
      asset => !!Number(asset.balance.amount),
    );

    return assets;
  } catch (error) {
    throw error;
  }
};
