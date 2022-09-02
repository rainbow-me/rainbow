import { useRoute } from '@react-navigation/core';
import lang from 'i18n-js';
import { isEmpty } from 'lodash';
import React, { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  FadeOut,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import useWallets from '../../hooks/useWallets';
import { Alert } from '../alerts';
import { Centered, ColumnWithMargins } from '../layout';
import { Numpad, NumpadValue } from '../numpad';
import AddCashFooter from './AddCashFooter';
import AddCashSelector from './AddCashSelector';
import { analytics } from '@/analytics';
import { toChecksumAddress } from '@/handlers/web3';
import { useAccountSettings, useDimensions, useIsWalletEthZero } from '@/hooks';
import { DAI_ADDRESS, ETH_ADDRESS } from '@/references';
import { padding } from '@/styles';
import { abbreviations } from '@/utils';

const currencies = [DAI_ADDRESS, ETH_ADDRESS];
const minimumPurchaseAmountUSD = 1;
const springConfig = {
  damping: 40,
  stiffness: 400,
  velocity: 0,
};

interface Props {
  limitWeekly: number;
  onClearError: () => void;
  onLimitExceeded: (limit: 'weekly' | 'yearly') => void;
  onPurchase: (params: { address: string; value: string }) => void;
  onShake: () => void;
  shakeAnim: Animated.SharedValue<number>;
}

const AddCashForm = ({
  limitWeekly,
  onClearError,
  onLimitExceeded,
  onPurchase,
  onShake,
  shakeAnim,
}: Props) => {
  const isWalletEthZero = useIsWalletEthZero();
  const { params } = useRoute();
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);

  const { isNarrowPhone, isSmallPhone, isTallPhone } = useDimensions();
  const scale = useSharedValue(1);

  const initialCurrencyIndex = 1;
  const [currency, setCurrency] = useState(currencies[initialCurrencyIndex]);
  const [value, setValue] = useState<string>(
    // @ts-expect-error not fully typed navigation
    params?.amount ? params?.amount?.toString() : ''
  );

  const { isReadOnlyWallet } = useWallets();
  const { accountAddress } = useAccountSettings();

  const onSubmit = useCallback(async () => {
    if (paymentSheetVisible) return;

    const numberValue = Number(value);

    async function handlePurchase() {
      try {
        analytics.track('Submitted Purchase', {
          category: 'add cash',
          label: currency,
          value: numberValue,
        });
        setPaymentSheetVisible(true);
        await onPurchase({ address: currency, value });
        // eslint-disable-next-line no-empty
      } catch (e) {
      } finally {
        setPaymentSheetVisible(false);
      }
    }

    if (isReadOnlyWallet) {
      const truncatedAddress = abbreviations.formatAddressForDisplay(
        toChecksumAddress(accountAddress) ?? '',
        4,
        6
      );
      Alert({
        buttons: [
          { style: 'cancel', text: lang.t('button.cancel') },
          { onPress: handlePurchase, text: lang.t('button.proceed') },
        ],
        message: lang.t('wallet.add_cash.watching_mode_confirm_message', {
          truncatedAddress,
        }),
        title: lang.t('wallet.add_cash.watching_mode_confirm_title'),
      });
    } else if (numberValue <= 50) {
      Alert({
        buttons: [
          { style: 'cancel', text: 'Cancel' },
          { onPress: handlePurchase, text: 'Proceed' },
        ],
        message:
          'You will receive this amount, but the blockchain fees associated with the purchase will likely be much higher.',
        title: 'Are you sure?',
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
      setValue(prevValue => {
        const isExceedingWeeklyLimit =
          parseFloat(prevValue + parseFloat(newValue)) > limitWeekly;

        const isInvalidFirstEntry =
          !prevValue &&
          (newValue === '0' || newValue === '.' || newValue === 'back');

        const isMaxDecimalCount = prevValue?.includes('.') && newValue === '.';

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

        if (nextValue.length > 3) {
          const characterCountFactor = 1 - (nextValue.length - 3) * 0.075;

          scale.value = withSpring(characterCountFactor, springConfig);
        } else if (nextValue.length === 3) {
          scale.value = withSpring(1, springConfig);
        }

        return nextValue;
      });

      analytics.track('Updated cash amount', {
        category: 'add cash',
      });
    },
    [limitWeekly, onClearError, onLimitExceeded, onShake, scale]
  );

  const onCurrencyChange = useCallback(
    val => {
      if (isWalletEthZero) {
        Alert({
          buttons: [{ text: lang.t('button.okay') }],
          message: lang.t(
            'wallet.add_cash.purchasing_dai_requires_eth_message'
          ),
          title: lang.t('wallet.add_cash.purchasing_dai_requires_eth_title'),
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
    <Animated.View
      exiting={FadeOut.duration(150).easing(Easing.out(Easing.ease))}
      style={sx.container}
    >
      <Centered flex={1}>
        <ColumnWithMargins
          align="center"
          justify="center"
          margin={isSmallPhone ? 0 : 8}
          style={padding.object(0, 24, isNarrowPhone ? 12 : 24)}
          width="100%"
        >
          <NumpadValue scale={scale} translateX={shakeAnim} value={value} />
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
          onSubmit={onSubmit}
        />
      </ColumnWithMargins>
    </Animated.View>
  );
};

export default React.memo(AddCashForm);

const sx = StyleSheet.create({
  container: {
    flex: 1,
  },
});
