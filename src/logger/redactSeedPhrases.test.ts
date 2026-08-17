import { describe, expect, test } from '@jest/globals';

import { redactIdentifiers } from '@/logger/redactIdentifiers';
import { redactSeedPhrases } from '@/logger/redactSeedPhrases';

const TWELVE_WORDS = 'legal winner thank year wave sausage worth useful legal winner thank yellow';
const TWENTY_FOUR_WORDS =
  'letter advice cage absurd amount doctor acoustic avoid letter advice cage above ' +
  'letter advice cage absurd amount doctor acoustic avoid letter advice cage abstract';

describe('redactSeedPhrases', () => {
  test('replaces a mnemonic with a placeholder that reads as an alarm', () => {
    expect(redactSeedPhrases(TWELVE_WORDS)).toBe('[seed phrase]');
    expect(redactSeedPhrases(TWENTY_FOUR_WORDS)).toBe('[seed phrase]');
  });

  test('keeps the surrounding message, so the report stays diagnosable', () => {
    const message = `Failed to import wallet: ${TWELVE_WORDS} is not valid`;

    expect(redactSeedPhrases(message)).toBe('Failed to import wallet: [seed phrase] is not valid');
  });

  test('catches a mnemonic wherever the words came from, not just the canonical order', () => {
    const shuffled = 'zebra youth wolf window velvet unique tunnel trophy trigger';

    expect(redactSeedPhrases(shuffled)).toBe('[seed phrase]');
  });

  test('fires at exactly eight words and not at seven', () => {
    const words = 'legal winner thank year wave sausage worth useful'.split(' ');

    expect(redactSeedPhrases(words.slice(0, 7).join(' '))).toBe('legal winner thank year wave sausage worth');
    expect(redactSeedPhrases(words.join(' '))).toBe('[seed phrase]');
  });

  test('leaves ordinary prose alone, because connectives are not wordlist words', () => {
    // viem's insufficient-funds message: eleven lowercase words in a row, but the longest run of
    // wordlist words in it is two. That gap is the whole reason this rule keys on membership rather
    // than on shape.
    const viem = 'The total cost (gas * gas fee + value) of executing this transaction exceeds the balance of the account';

    expect(redactSeedPhrases(viem)).toBe(viem);
  });

  test('leaves error text that happens to contain wordlist words', () => {
    const messages = [
      'Error while restoring back up',
      'missing response for request to the rpc node, will retry once more',
      'unable to decrypt private data on android, prompting for pin again',
      'Failed to fetch NFT collections data',
    ];

    for (const message of messages) {
      expect(redactSeedPhrases(message)).toBe(message);
    }
  });

  test('preserves whitespace in text it does not redact', () => {
    const spaced = 'first  line\n\tsecond   line with several   ordinary words here';

    expect(redactSeedPhrases(spaced)).toBe(spaced);
  });

  test('catches a mnemonic split across newlines and irregular spacing', () => {
    const wrapped = 'legal winner thank year wave\nsausage  worth\tuseful legal winner thank yellow';

    expect(redactSeedPhrases(wrapped)).toBe('[seed phrase]');
  });

  test('runs as part of redactIdentifiers, so every caller gets it', () => {
    expect(redactIdentifiers(`restore failed for ${TWELVE_WORDS}`)).toBe('restore failed for [seed phrase]');
  });

  test('collapses to one message regardless of which mnemonic appeared', () => {
    const first = redactIdentifiers(`restore failed for ${TWELVE_WORDS}`);
    const second = redactIdentifiers(`restore failed for ${TWENTY_FOUR_WORDS}`);

    expect(first).toBe(second);
  });
});
