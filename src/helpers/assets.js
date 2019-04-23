import { get } from 'lodash';

export const buildAssetHeaderUniqueIdentifier = ({ title, totalItems, totalValue }) => (
  `${title}_${totalItems}_${totalValue}`
);

export const buildAssetUniqueIdentifier = (item) => (
  `${get(item, 'balance.amount', '')}_${get(item, 'uniqueId')}`
);

export const buildUniqueTokenList = (uniqueTokens) => {
  const list = [];

  for (let i = 0; i < uniqueTokens.length; i += 2) {
    list.push({
      tokens: [uniqueTokens[i], uniqueTokens[i + 1]],
      uniqueId: `${get(uniqueTokens, `[${i}].uniqueId`)}__${get(uniqueTokens, `[${i + 1}].uniqueId`)}`,
    });
  }

  return list;
};

/* eslint-disable camelcase */
export const buildUniqueTokenName = ({ asset_contract, id, name }) => (
  name || `${asset_contract.name} #${id}`
);
/* eslint-enable camelcase */
