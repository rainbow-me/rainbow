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

export const GasSpeed = {
  fast: 'fast',
  normal: 'normal',
  slow: 'slow',
};

const labelOrder = [GasSpeed.slow, GasSpeed.normal, GasSpeed.fast];

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
        updateGasOption(selectedGasPriceItem.speed);
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
  const gasItems = map(labelOrder, (speed) => {
    const cost = get(txFees, `[${speed}].txFee.native.value.display`);
    const gwei = get(gasPrices, `[${speed}].value.display`);
    const time = get(gasPrices, `[${speed}].estimatedTime.display`);

    return {
      gweiValue: gwei,
      label: `${upperFirst(speed)}: ${cost}   ~${time}`,
      speed,
    };
  });
  return sortBy(gasItems, ({ speed }) => indexOf(labelOrder, speed));
};

export default {
  GasSpeedTypes,
  showTransactionSpeedOptions,
};
