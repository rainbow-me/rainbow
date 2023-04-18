import React, { MutableRefObject } from 'react';
import { TextInput } from 'react-native';
import ExchangeField from './ExchangeField';
import { Box } from '@rainbow-me/design-system';
import { Network } from '@rainbow-me/helpers';

interface ExchangeOutputFieldProps {
  color: string;
  editable: boolean;
  loading: boolean;
  network: Network;
  onFocus: ({ target }: { target: Element }) => void;
  onPressSelectOutputCurrency: () => void;
  onTapWhileDisabled?: () => void;
  outputAmount: string | null;
  outputCurrencyAddress: string;
  outputCurrencyMainnetAddress?: string;
  outputCurrencyAssetType?: string;
  outputCurrencySymbol?: string;
  outputFieldRef: MutableRefObject<TextInput | null>;
  setOutputAmount: (value: string | null) => void;
  updateAmountOnFocus: boolean;
  testID: string;
}

export default function ExchangeOutputField({
  color,
  editable,
  loading,
  network,
  onFocus,
  onPressSelectOutputCurrency,
  onTapWhileDisabled,
  outputAmount,
  outputCurrencyAddress,
  outputCurrencyMainnetAddress,
  outputCurrencyAssetType,
  outputCurrencySymbol,
  outputFieldRef,
  setOutputAmount,
  updateAmountOnFocus,
  testID,
}: ExchangeOutputFieldProps) {
  return (
    <Box
      alignItems="center"
      paddingBottom={android ? '10px' : '24px'}
      paddingTop={android ? '30px (Deprecated)' : '34px (Deprecated)'}
      style={{ overflow: 'hidden' }}
      width="full"
    >
      <ExchangeField
        address={outputCurrencyAddress}
        amount={outputAmount}
        color={color}
        editable={editable}
        loading={loading}
        mainnetAddress={outputCurrencyMainnetAddress}
        network={network}
        onFocus={onFocus}
        onPressSelectCurrency={onPressSelectOutputCurrency}
        onTapWhileDisabled={onTapWhileDisabled}
        ref={outputFieldRef}
        setAmount={setOutputAmount}
        symbol={outputCurrencySymbol}
        testID={testID}
        type={outputCurrencyAssetType}
        updateOnFocus={updateAmountOnFocus}
        useCustomAndroidMask={android}
      />
    </Box>
  );
}
