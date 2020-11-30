import { useRoute } from '@react-navigation/core';
import analytics from '@segment/analytics-react-native';
import { isEmpty } from 'lodash';
import React, { Fragment, useCallback, useState } from 'react';
import { Clock } from 'react-native-reanimated';
import { useDimensions, useIsWalletEthZero } from '../../hooks';
import { Alert } from '../alerts';
import { runSpring } from '../animations';
import { Centered, ColumnWithMargins } from '../layout';
import { Numpad, NumpadValue } from '../numpad';
import AddCashFooter from './AddCashFooter';
import AddCashSelector from './AddCashSelector';
import { DAI_ADDRESS, ETH_ADDRESS } from '@rainbow-me/references';
import { padding } from '@rainbow-me/styles';

const currencies = [DAI_ADDRESS, ETH_ADDRESS];
const minimumPurchaseAmountUSD = 1;

const AddCashForm = ({
  limitWeekly,
  onClearError,
  onLimitExceeded,
  onPurchase,
  onShake,
  shakeAnim,
}) => {
  const isWalletEthZero = useIsWalletEthZero();
  const { params } = useRoute();
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);

  const { isNarrowPhone, isSmallPhone, isTallPhone } = useDimensions();
  const [scaleAnim, setScaleAnim] = useState(1);

  const initialCurrencyIndex = isWalletEthZero ? 1 : 0;
  const [currency, setCurrency] = useState(currencies[initialCurrencyIndex]);
  const [value, setValue] = useState(
    params?.amount ? params?.amount?.toString() : ''
  );

  const handlePurchase = useCallback(async () => {
    if (paymentSheetVisible) return;
    try {
      analytics.track('Submitted Purchase', {
        category: 'add cash',
        label: currency,
        value: Number(value),
      });
      setPaymentSheetVisible(true);
      await onPurchase({ address: currency, value });
      // eslint-disable-next-line no-empty
    } catch (e) {
    } finally {
      setPaymentSheetVisible(false);
    }
  }, [currency, onPurchase, paymentSheetVisible, value]);

  const handleNumpadPress = useCallback(
    newValue => {
      setValue(prevValue => {
        const isExceedingWeeklyLimit =
          parseFloat(prevValue + parseFloat(newValue)) > limitWeekly;

        const isInvalidFirstEntry =
          !prevValue &&
          (newValue === '0' || newValue === '.' || newValue === 'back');

        const isMaxDecimalCount =
          prevValue && prevValue.includes('.') && newValue === '.';

        const isMaxDecimalLength =
          prevValue &&
          prevValue.charAt(prevValue.length - 3) === '.' &&
          newValue !== 'back';

        if (
          isExceedingWeeklyLimit ||
          isInvalidFirstEntry ||
          isMaxDecimalCount ||
          isMaxDecimalLength
        ) {
          if (isExceedingWeeklyLimit) onLimitExceeded('weekly');
          onShake();
          return prevValue;
        }

        let nextValue = prevValue;
        if (nextValue === null) {
          nextValue = newValue;
        } else if (newValue === 'back') {
          nextValue = prevValue.slice(0, -1);
        } else {
          nextValue += newValue;
        }

        onClearError();

        let prevPosition = 1;
        if (prevValue && prevValue.length > 3) {
          prevPosition = 1 - (prevValue.length - 3) * 0.075;
        }
        if (nextValue.length > 3) {
          const characterCount = 1 - (nextValue.length - 3) * 0.075;
          setScaleAnim(
            runSpring(new Clock(), prevPosition, characterCount, 0, 400, 40)
          );
        } else if (nextValue.length === 3) {
          setScaleAnim(runSpring(new Clock(), prevPosition, 1, 0, 400, 40));
        }

        return nextValue;
      });

      analytics.track('Updated cash amount', {
        category: 'add cash',
      });
    },
    [limitWeekly, onClearError, onLimitExceeded, onShake]
  );

  const onCurrencyChange = useCallback(
    val => {
      if (isWalletEthZero) {
        Alert({
          buttons: [{ text: 'Okay' }],
          message:
            'Before you can purchase DAI you must have some ETH in your wallet!',
          title: `You don't have any ETH!`,
        });
        analytics.track('Tried to purchase DAI but doesnt own any ETH', {
          category: 'add cash',
          label: val,
        });
      } else {
        setCurrency(val);
        analytics.track('Switched currency to purchase', {
          category: 'add cash',
          label: val,
        });
      }
    },
    [isWalletEthZero]
  );

  return (
    <Fragment>
      <Centered flex={1}>
        <ColumnWithMargins
          align="center"
          css={padding(0, 24, isNarrowPhone ? 12 : 24)}
          justify="center"
          margin={isSmallPhone ? 0 : 8}
          width="100%"
        >
          <NumpadValue scale={scaleAnim} translateX={shakeAnim} value={value} />
          <AddCashSelector
            currencies={currencies}
            initialCurrencyIndex={initialCurrencyIndex}
            isWalletEthZero={isWalletEthZero}
            onSelect={onCurrencyChange}
          />
        </ColumnWithMargins>
      </Centered>
      <ColumnWithMargins align="center" margin={isTallPhone ? 27 : 12}>
        <Centered maxWidth={313}>
          <Numpad
            onPress={handleNumpadPress}
            width={isNarrowPhone ? 275 : '100%'}
          />
        </Centered>
        <AddCashFooter
          disabled={
            isEmpty(value) || parseFloat(value) < minimumPurchaseAmountUSD
          }
          onDisabledPress={onShake}
          onSubmit={handlePurchase}
        />
      </ColumnWithMargins>
    </Fragment>
  );
};

export default React.memo(AddCashForm);
