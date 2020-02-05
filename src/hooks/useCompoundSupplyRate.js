import { get } from 'lodash';
import { useEffect, useState } from 'react';
import { useQuery } from '@apollo/client';
import { COMPOUND_SUPPLY_RATE } from '../apollo/queries';

const CDAI_TOKEN_ADDRESS = '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643';

export default function useCompoundSupplyRate(
  cTokenAddress = CDAI_TOKEN_ADDRESS
) {
  const [supplyRate, setSupplyRate] = useState(null);
  const { data } = useQuery(COMPOUND_SUPPLY_RATE, {
    pollInterval: 1000,
    variables: { cTokenAddress },
  });

  const extractedSupplyRate = Number(get(data, 'markets[0].supplyRate'));

  useEffect(() => {
    if (extractedSupplyRate && supplyRate !== extractedSupplyRate) {
      setSupplyRate(extractedSupplyRate);
    }
  }, [extractedSupplyRate, supplyRate]);

  return supplyRate ? `${(supplyRate * 100).toFixed(1)}%` : null;
}
