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

const GasSpeedTypes = ['slow', 'normal', 'fast'];

const showTransactionSpeedOptions = (
  gasPrices,
  txFees,
  updateGasOption,
  onSuccess
) => {
  const options = [
    { label: 'Cancel' },
    ...formatGasSpeedItems(gasPrices, txFees),
  ];

  showActionSheetWithOptions(
    {
      cancelButtonIndex: 0,
      options: options.map(property('label')),
    },
    buttonIndex => {
      if (buttonIndex > 0) {
        const selectedGasPriceItem = options[buttonIndex];

        updateGasOption(selectedGasPriceItem.value);
        analytics.track('Updated Gas Price', {
          gasPrice: selectedGasPriceItem.gweiValue,
        });
      }

      if (isFunction(onSuccess)) {
        onSuccess();
      }
    }
  );
};

const formatGasSpeedItems = (gasPrices, txFees) => {
  const gasItems = map(GasSpeedTypes, label => {
    let speed = label;
    if (label === 'normal') {
      speed = 'average';
    }

    const cost = get(txFees, `[${speed}].txFee.native.value.display`);
    const gwei = get(gasPrices, `[${speed}].value.display`);
    const time = get(gasPrices, `[${speed}].estimatedTime.display`);

    return {
      gweiValue: gwei,
      label: `${upperFirst(label)}: ${cost}   ~${time.slice(0, -1)}`,
      value: speed,
    };
  });
  return sortBy(gasItems, ({ value }) => indexOf(GasSpeedTypes, value));
};

export default {
  GasSpeedTypes,
  showTransactionSpeedOptions,
};
