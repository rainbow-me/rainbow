/**
 * Caches the last successful input/result pair, comparing inputs with strict equality.
 */
export function memoizeLast<Input>(compute: (input: Input) => string): (input: Input) => string {
  let previousInput: Input | undefined;
  let value: string | undefined;

  return input => {
    if (value === undefined || input !== previousInput) {
      value = compute(input);
      previousInput = input;
    }
    return value;
  };
}
