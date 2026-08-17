import englishWordlist from 'bip39/src/wordlists/english.json';

const BIP39_WORDS = new Set<string>(englishWordlist);
const MIN_RUN = 8;
const PLACEHOLDER = '[seed phrase]';

/**
 * Every BIP-39 English word is 3 to 8 lowercase letters, so this only has to consider runs of those.
 * Narrow enough to skip most text outright, since this runs over every string on every event.
 */
const CANDIDATE_RUN = /[a-z]{3,8}(?:\s+[a-z]{3,8})+/g;

export function redactSeedPhrases(text: string): string {
  return text.replace(CANDIDATE_RUN, run => {
    const words = run.split(/\s+/);
    if (words.length < MIN_RUN) return run;

    const output: string[] = [];
    let redacted = false;
    let index = 0;

    while (index < words.length) {
      let end = index;
      while (end < words.length && BIP39_WORDS.has(words[end])) end += 1;

      if (end - index >= MIN_RUN) {
        output.push(PLACEHOLDER);
        redacted = true;
        index = end;
      } else {
        output.push(words[index]);
        index += 1;
      }
    }

    // Leave the original untouched unless something was actually replaced, so ordinary prose keeps
    // its own whitespace rather than being collapsed to single spaces by the rejoin below.
    return redacted ? output.join(' ') : run;
  });
}
