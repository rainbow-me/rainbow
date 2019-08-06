import { mapValues, sortBy, values } from 'lodash';
import { compose, withProps } from 'recompact';
import uniswapAssets from '../references/uniswap-pairs.json';

const sortUniswapAssetsByName = () => {
  const assetList = values(mapValues(uniswapAssets, (asset, address) => ({ ...asset, address })));
  return sortBy(assetList, asset => asset.name);
}

export default Component => compose(
  withProps({ sortedUniswapAssets: sortUniswapAssetsByName() }),
)(Component);

