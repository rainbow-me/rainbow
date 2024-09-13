import React, { MutableRefObject } from 'react';
import { TextInput } from 'react-native';
import ExchangeField from './ExchangeField';
import { Box } from '@rainbow-me/design-system';
import { TokenColors } from '@/graphql/__generated__/metadata';
import { ChainId } from '@/chains/types';

interface ExchangeOutputFieldProps {
  color: string;
  chainId: ChainId;
  editable: boolean;
  loading: boolean;
  onFocus: ({ target }: { target: Element }) => void;
  onPressSelectOutputCurrency: () => void;
  onTapWhileDisabled?: () => void;
  outputAmount: string | null;
  outputCurrencyIcon?: string;
  outputCurrencyColors?: TokenColors;
  outputCurrencyAddress: string;
  outputCurrencyMainnetAddress?: string;
  outputCurrencyNetwork?: string;
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
  chainId,
  onFocus,
  onPressSelectOutputCurrency,
  onTapWhileDisabled,
  outputAmount,
  outputCurrencyIcon,
  outputCurrencyColors,
  outputCurrencyAddress,
  outputCurrencyMainnetAddress,
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
        icon={outputCurrencyIcon}
        colors={outputCurrencyColors}
        address={outputCurrencyAddress}
        amount={outputAmount}
        color={color}
        editable={editable}
        loading={loading}
        mainnetAddress={outputCurrencyMainnetAddress}
        chainId={chainId}
        onFocus={onFocus}
        onPressSelectCurrency={onPressSelectOutputCurrency}
        onTapWhileDisabled={onTapWhileDisabled}
        ref={outputFieldRef}
        setAmount={setOutputAmount}
        symbol={outputCurrencySymbol}
        testID={testID}
        updateOnFocus={updateAmountOnFocus}
        useCustomAndroidMask={android}
      />
    </Box>
  );
}
