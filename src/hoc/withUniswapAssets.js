import {
  mapValues,
  sortBy,
  property,
  values,
} from 'lodash';
import { compose, withProps } from 'recompact';
import uniswapAssetsRaw from '../references/uniswap-pairs.json';

const mapUniswapAssetItem = (asset, address) => ({ ...asset, address });

const uniswapAssets = values(mapValues(uniswapAssetsRaw, mapUniswapAssetItem));
const sortedUniswapAssets = sortBy(uniswapAssets, property('name'));

export default withProps({ sortedUniswapAssets });

