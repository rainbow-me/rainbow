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
