import { get, map, slice } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { apiGetTopMovers } from '../handlers/topMovers';

const TOP_MOVERS_PER_ROW_MAX = 5;
const TOP_MOVERS_PER_ROW_MIN = 3;

const updatePriceAndExchangeAddress = (movers, genericAssets, uniswapPairs) => {
  if (movers.length < TOP_MOVERS_PER_ROW_MIN) return [];
  const topMovers = slice(movers, 0, TOP_MOVERS_PER_ROW_MAX);
  return map(topMovers, mover => {
    const price = get(genericAssets, `${mover.address}.price`);
    const exchangeAddress = get(
      uniswapPairs,
      `${mover.address}.exchangeAddress`
    );
    return {
      ...mover,
      exchangeAddress,
      fallbackPrice: mover.price,
      price,
    };
  });
};

export default function useTopMovers() {
  const [movers, setMovers] = useState({});
  const { genericAssets, pairs: uniswapPairs } = useSelector(
    ({ data: { genericAssets }, uniswap: { pairs } }) => ({
      genericAssets,
      pairs,
    })
  );

  const updateTopMovers = useCallback(async () => {
    const {
      gainers: gainersData,
      losers: losersData,
    } = await apiGetTopMovers();

    const gainers = updatePriceAndExchangeAddress(
      gainersData,
      genericAssets,
      uniswapPairs
    );
    const losers = updatePriceAndExchangeAddress(
      losersData,
      genericAssets,
      uniswapPairs
    );
    setMovers({ gainers, losers });
  }, []);

  useEffect(() => {
    updateTopMovers();
  }, [updateTopMovers]);

  return movers;
}
