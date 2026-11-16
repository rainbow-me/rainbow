import { createDerivedStore } from '@storesjs/stores';

import { supportedCurrencies as supportedNativeCurrencies } from '@/features/currency/supportedCurrencies';
import { type NativeCurrencyKey } from '@/features/currency/types';
import { useAppSettingsStore } from '@/features/settings/data/appSettingsStore';
import { type ThemeContextProps } from '@/theme/ThemeContext';
import { useThemeStore } from '@/theme/themeStore';

import { useEditTokensStore } from '../base/editStateStore';

export type ExtendedState = {
  isCoinListEdited: boolean;
  nativeCurrency: NativeCurrencyKey;
  nativeCurrencySymbol: string;
  theme: ThemeContextProps;
};

/**
 * Provides shared state for wallet screen list items.
 */
export const useExtendedStateStore = createDerivedStore<ExtendedState>(
  $ => {
    const isCoinListEdited = $(useEditTokensStore, state => state.isCoinListEdited);
    const nativeCurrency = $(useAppSettingsStore, state => state.currency);
    const theme = $(useThemeStore, s => s);

    return {
      isCoinListEdited,
      nativeCurrency,
      nativeCurrencySymbol: supportedNativeCurrencies[nativeCurrency].symbol,
      theme,
    };
  },
  { lockDependencies: true }
);
