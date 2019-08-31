import analytics from '@segment/analytics-react-native';
import {
  get,
  indexOf,
  isFunction,
  map,
  property,
  sortBy,
  upperFirst,
} from 'lodash';
import { showActionSheetWithOptions } from './actionsheet';

const labelOrder = ['slow', 'average', 'fast'];

const showTransactionSpeedOptions = (
  gasPrices,
  txFees,
  updateGasOption,
  onSuccess,
) => {
  const options = [
    { label: 'Cancel' },
    ...formatGasSpeedItems(gasPrices, txFees),
  ];

  showActionSheetWithOptions({
    cancelButtonIndex: 0,
    options: options.map(property('label')),
  }, (buttonIndex) => {
    if (buttonIndex > 0) {
      const selectedGasPriceItem = options[buttonIndex];

      updateGasOption(selectedGasPriceItem.value);
      analytics.track('Updated Gas Price', { gasPrice: selectedGasPriceItem.gweiValue });
    }

    if (isFunction(onSuccess)) {
      onSuccess();
    }
  });
};

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
  showTransactionSpeedOptions,
};
