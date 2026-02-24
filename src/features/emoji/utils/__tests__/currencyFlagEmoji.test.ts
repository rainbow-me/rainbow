import { supportedNativeCurrencies } from '@/references';
import { resolveCurrencyFlagEmoji } from '../currencyFlagEmoji';

describe('resolveCurrencyFlagEmoji', () => {
  it('resolves every configured fiat currency flag from emojis data', () => {
    const currencies = Object.values(supportedNativeCurrencies) as Array<{ emoji: string; emojiName?: string }>;

    currencies.forEach(currency => {
      if (!currency.emojiName) return;
      expect(resolveCurrencyFlagEmoji(currency.emojiName)).toBe(currency.emoji);
    });
  });

  it('returns an empty string for missing and unknown emoji names', () => {
    expect(resolveCurrencyFlagEmoji()).toBe('');
    expect(resolveCurrencyFlagEmoji('unknown_country')).toBe('');
  });
});
