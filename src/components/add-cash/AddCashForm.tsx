import { useRoute } from '@react-navigation/core';
import analytics from '@segment/analytics-react-native';
import { isEmpty } from 'lodash';
import React, { Fragment, useCallback, useState } from 'react';
import { Clock } from 'react-native-reanimated';
import useWallets from '../../hooks/useWallets';
import { Alert } from '../alerts';
import { runSpring } from '../animations';
import { Centered, ColumnWithMargins } from '../layout';
import { Numpad, NumpadValue } from '../numpad';
// @ts-expect-error ts-migrate(6142) FIXME: Module './AddCashFooter' was resolved to '/Users/n... Remove this comment to see the full error message
import AddCashFooter from './AddCashFooter';
// @ts-expect-error ts-migrate(6142) FIXME: Module './AddCashSelector' was resolved to '/Users... Remove this comment to see the full error message
import AddCashSelector from './AddCashSelector';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { toChecksumAddress } from '@rainbow-me/handlers/web3';
import {
  useAccountSettings,
  useDimensions,
  useIsWalletEthZero,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { DAI_ADDRESS, ETH_ADDRESS } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { abbreviations } from '@rainbow-me/utils';

const currencies = [DAI_ADDRESS, ETH_ADDRESS];
const minimumPurchaseAmountUSD = 1;

const AddCashForm = ({
  limitWeekly,
  onClearError,
  onLimitExceeded,
  onPurchase,
  onShake,
  shakeAnim,
}: any) => {
  const isWalletEthZero = useIsWalletEthZero();
  const { params } = useRoute();
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);

  const { isNarrowPhone, isSmallPhone, isTallPhone } = useDimensions();
  const [scaleAnim, setScaleAnim] = useState(1);

  const initialCurrencyIndex = 1;
  const [currency, setCurrency] = useState(currencies[initialCurrencyIndex]);
  const [value, setValue] = useState(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'amount' does not exist on type 'object'.
    params?.amount ? params?.amount?.toString() : ''
  );

  const { isReadOnlyWallet } = useWallets();
  const { accountAddress } = useAccountSettings();

  const onSubmit = useCallback(async () => {
    if (paymentSheetVisible) return;
    async function handlePurchase() {
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
    }

    if (value <= 50) {
      Alert({
        buttons: [
          { style: 'cancel', text: 'Cancel' },
          { onPress: handlePurchase, text: 'Proceed' },
        ],
        message:
          'You will receive this amount, but the blockchain fees associated with the purchase will likely be much higher.',
        title: 'Are you sure?',
      });
    } else if (isReadOnlyWallet) {
      const truncatedAddress = abbreviations.formatAddressForDisplay(
        toChecksumAddress(accountAddress),
        4,
        6
      );
      Alert({
        buttons: [
          { style: 'cancel', text: 'Cancel' },
          { onPress: handlePurchase, text: 'Proceed' },
        ],
        message: `The wallet you have open is read-only, so you can’t control what’s inside. Are you sure you want to add cash to ${truncatedAddress}?`,
        title: `You’re in Watching Mode`,
      });
    } else {
      await handlePurchase();
    }
  }, [
    accountAddress,
    isReadOnlyWallet,
    currency,
    onPurchase,
    paymentSheetVisible,
    value,
  ]);

  const handleNumpadPress = useCallback(
    newValue => {
      setValue((prevValue: any) => {
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
            // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'AnimatedNode<number>' is not ass... Remove this comment to see the full error message
            runSpring(new Clock(), prevPosition, characterCount, 0, 400, 40)
          );
        } else if (nextValue.length === 3) {
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'AnimatedNode<number>' is not ass... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered flex={1}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ColumnWithMargins
          align="center"
          css={padding(0, 24, isNarrowPhone ? 12 : 24)}
          justify="center"
          margin={isSmallPhone ? 0 : 8}
          width="100%"
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <NumpadValue scale={scaleAnim} translateX={shakeAnim} value={value} />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <AddCashSelector
            currencies={currencies}
            initialCurrencyIndex={initialCurrencyIndex}
            isWalletEthZero={isWalletEthZero}
            onSelect={onCurrencyChange}
          />
        </ColumnWithMargins>
      </Centered>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ColumnWithMargins align="center" margin={isTallPhone ? 27 : 12}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered maxWidth={313}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Numpad
            onPress={handleNumpadPress}
            width={isNarrowPhone ? 275 : '100%'}
          />
        </Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <AddCashFooter
          disabled={
            isEmpty(value) || parseFloat(value) < minimumPurchaseAmountUSD
          }
          onDisabledPress={onShake}
          onSubmit={onSubmit}
        />
      </ColumnWithMargins>
    </Fragment>
  );
};

export default React.memo(AddCashForm);
