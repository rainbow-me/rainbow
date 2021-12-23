import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { getUniswapV2Tokens } from '@rainbow-me/handlers/dispersion';
import { sortAssetsByNativeAmountSelector } from '@rainbow-me/helpers/assetSelectors';
import NetworkTypes from '@rainbow-me/networkTypes';
import { ETH_ADDRESS } from '@rainbow-me/references';

const networkSelector = state => state.settings.network;

const useUniswapAssetsInWallet = () => {
  const [uniswapAssets, setUniswapAssets] = useState([]);
  const network = useSelector(networkSelector);
  const isMainnet = network === NetworkTypes.mainnet;
  const { allAssets } = useSelector(sortAssetsByNativeAmountSelector);
  const getUniswapAssets = useCallback(async () => {
    let uniswapAssets;
    if (isMainnet) {
      const uniswapData = await getUniswapV2Tokens(
        allAssets.map(({ address }) => address)
      );
      uniswapAssets = uniswapData || [];
    } else {
      uniswapAssets = allAssets;
    }
    setUniswapAssets(uniswapAssets);
  }, [allAssets, isMainnet]);
  const getIsUniswapAsset = asset => {
    return (
      uniswapAssets.find(
        ({ address }) => address === asset.address.toLowerCase()
      ) || asset.address === ETH_ADDRESS
    );
  };
  useEffect(() => {
    getUniswapAssets();
  }, [getUniswapAssets]);

  return allAssets.filter(getIsUniswapAsset);
};

export default useUniswapAssetsInWallet;
