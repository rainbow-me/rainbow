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
import { showActionSheetWithOptions } from '@rainbow-me/utils';

const FAST = 'fast';
const NORMAL = 'normal';
const SLOW = 'slow';

const GasSpeedOrder = [SLOW, NORMAL, FAST];

const showTransactionSpeedOptions = (
  gasPrices,
  txFees,
  updateGasOption,
  onSuccess
) => {
  const options = [
    ...formatGasSpeedItems(gasPrices, txFees),
    { label: 'Cancel' },
  ];
  const cancelButtonIndex = options.length - 1;

  showActionSheetWithOptions(
    {
      cancelButtonIndex,
      options: options.map(property('label')),
    },
    buttonIndex => {
      if (buttonIndex !== undefined && buttonIndex !== cancelButtonIndex) {
        const selectedGasPriceItem = options[buttonIndex];
        updateGasOption(selectedGasPriceItem.speed);
        analytics.track('Updated Gas Price', {
          gasPrice: selectedGasPriceItem.gweiValue,
        });

        if (isFunction(onSuccess)) {
          onSuccess();
        }
      }
    }
  );
};

const formatGasSpeedItems = (gasPrices, txFees) => {
  const gasItems = map(GasSpeedOrder, speed => {
    const cost = get(txFees, `[${speed}].txFee.native.value.display`);
    const gwei = get(gasPrices, `[${speed}].value.display`);
    const time = get(gasPrices, `[${speed}].estimatedTime.display`);

    return {
      gweiValue: gwei,
      label: `${upperFirst(speed)}: ${cost}   ~${time}`,
      speed,
    };
  });
  return sortBy(gasItems, ({ speed }) => indexOf(GasSpeedOrder, speed));
};

export default {
  FAST,
  GasSpeedOrder,
  NORMAL,
  showTransactionSpeedOptions,
  SLOW,
};
