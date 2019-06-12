import { compact, get } from 'lodash';

export const buildAssetHeaderUniqueIdentifier = ({
  showShitcoins,
  title,
  totalItems,
  totalValue,
}) => ([showShitcoins, title, totalItems, totalValue].join('_'));

export const buildAssetUniqueIdentifier = (item) => {
  const balance = get(item, 'balance.amount', '');
  const nativePrice = get(item, 'native.price.display', '');
  const uniqueId = get(item, 'uniqueId');

  return compact([balance, nativePrice, uniqueId]).join('_');
};

export const buildUniqueTokenList = (uniqueTokens) => {
  const rows = [];

  for (let i = 0; i < uniqueTokens.length; i += 2) {
    uniqueTokens[i].rowNumber = i/2;
    const tokens = compact([uniqueTokens[i], uniqueTokens[i + 1]]);

    rows.push({
      tokens,
      uniqueId: tokens.map(({ uniqueId }) => uniqueId).join('__'),
    });
  }
  return rows;
};

/* eslint-disable camelcase */
export const buildUniqueTokenName = ({ asset_contract, id, name }) => (
  name || `${asset_contract.name} #${id}`
);
/* eslint-enable camelcase */
