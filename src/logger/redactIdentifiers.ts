/**
 * Replaces identifier-shaped values in free text on its way to Sentry. Shape-based rather than a
 * known-value list, because SDKs interpolate their own values into their own messages: e.g an ethers
 * `CALL_EXCEPTION` carries the JSON-RPC request id, so one recurring failure reads as a different
 * string every time. That costs titles and message search rather than grouping, which for these
 * events keys on the stack.
 *
 * Not a secret filter, and must not be relied on as one. Anything below the length floor or
 * containing punctuation passes straight through.
 */
const PATTERNS: [RegExp, string][] = [
  // Boundaries are hand-written because `\b` counts `_` as a word character, so it skips the address
  // in a composite key like `optimism_0x…_0`. The leading one is consumed, hence `$1` below.
  [/0x[a-fA-F0-9]{64}(?![a-fA-F0-9])/g, '[hash]'],
  [/0x[a-fA-F0-9]{40}(?![a-fA-F0-9])/g, '[address]'],
  // json-rpc request id. Not a privacy rule; a request counter identifies nobody. ethers folds the
  // whole request body into the message and its counter increments per call, so without this every
  // retry of one failure gets a different title. The body arrives as escaped json inside the message,
  // hence the optional backslash on each quote.
  [/(\\?")id(\\?")\s*:\s*\d+/g, '$1id$2:[id]'],
  // misc: api keys, request ids, encoded blobs. A letter and a digit are both required so prose is
  // left alone. The floor is 12, measured against a day of production messages: 8 would eat 4-byte
  // function selectors, and 16 lets base64url tokens through, since `-` and `_` break them into
  // shorter runs. Widening the run to include `-` and `_` was tried and rejected: it eats error
  // codes like `v5-errors-CALL_EXCEPTION`.
  [/(^|[^A-Za-z0-9])((?=[A-Za-z0-9]*[0-9])(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{12,})(?![A-Za-z0-9])/g, '$1[redacted]'],
];

export function redactIdentifiers(text: string): string {
  return PATTERNS.reduce((redacted, [pattern, placeholder]) => redacted.replace(pattern, placeholder), text);
}
