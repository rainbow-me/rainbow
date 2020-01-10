import { get } from 'lodash';
import { convertRawAmountToBalance } from '../helpers/utilities';
import { parseAsset } from './accounts';

/**
 * @desc parse account compound deposits
 * @param  {Object} [data]
 * @return {Array}
 */
export const parseCompoundDeposits = (data, tokenOverrides) => {
  let assets = data.map(assetData => {
    const asset = parseAsset(assetData.asset.asset, tokenOverrides);
    return {
      ...asset,
      balance: convertRawAmountToBalance(assetData.ctokens, asset),
    };
  });

  return assets.filter(asset => !!Number(get(asset, 'balance.amount')));
};
