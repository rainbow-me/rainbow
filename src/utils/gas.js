import {
  get,
  indexOf,
  map,
  sortBy,
  upperFirst,
} from 'lodash';

const labelOrder = ['slow', 'average', 'fast'];

const formatGasSpeedItems = (gasPrices, txFees) => {
  const gasItems = map(labelOrder, speed => {
    const cost = get(txFees, `[${speed}].txFee.native.value.display`);
    const gwei = get(gasPrices, `[${speed}].value.display`);
    const time = get(gasPrices, `[${speed}].estimatedTime.display`);

    return {
      gweiValue: gwei,
      label: `${upperFirst(speed)}: ${cost}   ~${time.slice(0, -1)}`,
      value: speed,
    };
  });
  return sortBy(gasItems, ({ value }) => indexOf(labelOrder, value));
};

export default {
  formatGasSpeedItems,
};
