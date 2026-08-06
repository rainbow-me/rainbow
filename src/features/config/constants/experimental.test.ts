import { defaultConfig, defaultConfigValues, SOLANA_BALANCES } from './experimental';

/**
 * The Solana flag ships dark. Pinned as a test rather than trusted by reading,
 * because "unfinished user-visible work is off by default" is the property the
 * whole surface rests on, and a one-character edit can flip it silently.
 */
describe('the Solana balances flag', () => {
  it('is off by default', () => {
    expect(defaultConfig[SOLANA_BALANCES].value).toBe(false);
    expect(defaultConfigValues[SOLANA_BALANCES]).toBe(false);
  });

  it('is togglable from developer settings and needs a restart to take effect', () => {
    expect(defaultConfig[SOLANA_BALANCES].settings).toBe(true);
    expect(defaultConfig[SOLANA_BALANCES].needsRestart).toBe(true);
  });
});
